import { NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import {
  bookmark,
  follow,
  logMovie,
  logMovieWatchedDate,
  reco,
  reviewMovie,
} from '@libs/db/schemas';
import {
  createFakeNotifyClient,
  createTestMovie,
  createTestTvSeries,
  createTestUser,
  TestDatabase,
} from '@libs/testing';
import { User } from '../../auth/auth.service';
import { LogServerEvents } from '@libs/realtime';
import type { RealtimeGateway } from '../../realtime/realtime.gateway';
import { RecoType } from '../../recos/dto/recos.dto';

jest.mock('../../realtime/realtime.gateway', () => ({ RealtimeGateway: jest.fn() }));

const { MovieLogsService } =
  require('./movie-logs.service') as typeof import('./movie-logs.service');
const { RecosService } =
  require('../../recos/recos.service') as typeof import('../../recos/recos.service');
const { UserRecosService } =
  require('../../users/recos/user-recos.service') as typeof import('../../users/recos/user-recos.service');

describe('MovieLogsService', () => {
  let testDb: TestDatabase;

  beforeAll(async () => {
    testDb = await TestDatabase.create();
  });

  afterEach(async () => {
    await testDb.reset();
  });

  afterAll(async () => {
    await testDb.close();
  });

  const asUser = (row: { id: string }) => row as unknown as User;
  const fakeGateway = () => ({ emitToUser: jest.fn() }) as unknown as jest.Mocked<RealtimeGateway>;

  function buildService(gateway?: jest.Mocked<RealtimeGateway>) {
    const userRecosService = new UserRecosService(testDb.db);
    const recosService = new RecosService(
      testDb.db,
      createFakeNotifyClient(),
      fakeGateway(),
      userRecosService,
    );
    return new MovieLogsService(testDb.db, recosService, gateway ?? fakeGateway());
  }

  async function mutualFollow(userAId: string, userBId: string) {
    await testDb.db
      .insert(follow)
      .values({ followerId: userAId, followingId: userBId, status: 'accepted' });
    await testDb.db
      .insert(follow)
      .values({ followerId: userBId, followingId: userAId, status: 'accepted' });
  }

  describe('get', () => {
    it('returns null when the user has not logged the movie', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const service = buildService();

      await expect(service.get(asUser(user), movie.id)).resolves.toBeNull();
    });

    it('returns the log merged with its review', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const service = buildService();
      await service.set(asUser(user), movie.id, {});

      const result = await service.get(asUser(user), movie.id);

      expect(result?.movieId).toBe(movie.id);
      expect(result?.review).toBeNull();
    });
  });

  describe('set', () => {
    it('creates a new log on first call: watchCount 1, one watched date row', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const service = buildService();

      const result = await service.set(asUser(user), movie.id, { rating: 8.5, isLiked: true });

      expect(result.watchCount).toBe(1);
      expect(result.rating).toBe(8.5);
      expect(result.isLiked).toBe(true);

      const dates = await testDb.db
        .select()
        .from(logMovieWatchedDate)
        .innerJoin(logMovie, eq(logMovie.id, logMovieWatchedDate.logMovieId))
        .where(and(eq(logMovie.userId, user.id), eq(logMovie.movieId, movie.id)));
      expect(dates).toHaveLength(1);
    });

    it('does not insert another watched date on a subsequent update', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const service = buildService();
      await service.set(asUser(user), movie.id, {});

      await service.set(asUser(user), movie.id, { rating: 5 });

      const dates = await testDb.db
        .select()
        .from(logMovieWatchedDate)
        .innerJoin(logMovie, eq(logMovie.id, logMovieWatchedDate.logMovieId))
        .where(and(eq(logMovie.userId, user.id), eq(logMovie.movieId, movie.id)));
      expect(dates).toHaveLength(1);
    });

    it('keeps the existing rating when rating is omitted from the update', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const service = buildService();
      await service.set(asUser(user), movie.id, { rating: 7 });

      const result = await service.set(asUser(user), movie.id, { isLiked: true });

      expect(result.rating).toBe(7);
      expect(result.isLiked).toBe(true);
    });

    it('clears the rating when rating is explicitly set to null', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const service = buildService();
      await service.set(asUser(user), movie.id, { rating: 7 });

      const result = await service.set(asUser(user), movie.id, { rating: null });

      expect(result.rating).toBeNull();
    });

    it('keeps isLiked false when omitted, and does not force it back to false once set true', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const service = buildService();
      await service.set(asUser(user), movie.id, { isLiked: true });

      const result = await service.set(asUser(user), movie.id, { rating: 3 });

      expect(result.isLiked).toBe(true);
    });

    it('emits a MOVIE_LOG_SET realtime event', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const gateway = fakeGateway();
      const service = buildService(gateway);

      const result = await service.set(asUser(user), movie.id, {});

      expect(gateway.emitToUser).toHaveBeenCalledWith(
        user.id,
        LogServerEvents.MOVIE_LOG_SET,
        result,
      );
    });

    describe('bookmark completion', () => {
      it('completes an active bookmark for the movie when the log is created', async () => {
        const { user } = await createTestUser(testDb.db);
        const movie = await createTestMovie(testDb.db);
        await testDb.db
          .insert(bookmark)
          .values({ userId: user.id, movieId: movie.id, type: 'movie', status: 'active' });
        const service = buildService();

        await service.set(asUser(user), movie.id, {});

        const [row] = await testDb.db
          .select()
          .from(bookmark)
          .where(and(eq(bookmark.userId, user.id), eq(bookmark.movieId, movie.id)));
        expect(row.status).toBe('completed');
      });

      it('does not touch a bookmark for a different movie', async () => {
        const { user } = await createTestUser(testDb.db);
        const loggedMovie = await createTestMovie(testDb.db);
        const otherMovie = await createTestMovie(testDb.db);
        await testDb.db
          .insert(bookmark)
          .values({ userId: user.id, movieId: otherMovie.id, type: 'movie', status: 'active' });
        const service = buildService();

        await service.set(asUser(user), loggedMovie.id, {});

        const [row] = await testDb.db
          .select()
          .from(bookmark)
          .where(and(eq(bookmark.userId, user.id), eq(bookmark.movieId, otherMovie.id)));
        expect(row.status).toBe('active');
      });

      it('does not touch another user bookmark for the same movie', async () => {
        const { user: logger } = await createTestUser(testDb.db);
        const { user: otherUser } = await createTestUser(testDb.db);
        const movie = await createTestMovie(testDb.db);
        await testDb.db
          .insert(bookmark)
          .values({ userId: otherUser.id, movieId: movie.id, type: 'movie', status: 'active' });
        const service = buildService();

        await service.set(asUser(logger), movie.id, {});

        const [row] = await testDb.db
          .select()
          .from(bookmark)
          .where(and(eq(bookmark.userId, otherUser.id), eq(bookmark.movieId, movie.id)));
        expect(row.status).toBe('active');
      });

      it('leaves an already-completed bookmark alone (idempotent)', async () => {
        const { user } = await createTestUser(testDb.db);
        const movie = await createTestMovie(testDb.db);
        const [row] = await testDb.db
          .insert(bookmark)
          .values({ userId: user.id, movieId: movie.id, type: 'movie', status: 'completed' })
          .returning();
        const service = buildService();

        await service.set(asUser(user), movie.id, {});

        const [after] = await testDb.db.select().from(bookmark).where(eq(bookmark.id, row.id));
        expect(after.status).toBe('completed');
      });

      it('does not complete a bookmark that only gets created after the movie was already logged, until the next set() call', async () => {
        const { user } = await createTestUser(testDb.db);
        const movie = await createTestMovie(testDb.db);
        const service = buildService();
        await service.set(asUser(user), movie.id, {});

        const [row] = await testDb.db
          .insert(bookmark)
          .values({ userId: user.id, movieId: movie.id, type: 'movie', status: 'active' })
          .returning();

        // Bookmarking after the fact doesn't retroactively complete — only set() does.
        const [stillActive] = await testDb.db
          .select()
          .from(bookmark)
          .where(eq(bookmark.id, row.id));
        expect(stillActive.status).toBe('active');

        await service.set(asUser(user), movie.id, { rating: 4 });

        const [nowCompleted] = await testDb.db
          .select()
          .from(bookmark)
          .where(eq(bookmark.id, row.id));
        expect(nowCompleted.status).toBe('completed');
      });

      it('does not complete a tv_series-type bookmark that happens to share the movie tmdb id', async () => {
        const { user } = await createTestUser(testDb.db);
        const movie = await createTestMovie(testDb.db);
        // Movie and TV series ids are independent TMDB namespaces, so a coincidental id
        // collision is possible — this pins that the completion query is scoped by
        // `type = 'movie'`, not just movieId, matching the WHERE clause in the source.
        await createTestTvSeries(testDb.db, { id: movie.id });
        const [tvBookmark] = await testDb.db
          .insert(bookmark)
          .values({ userId: user.id, tvSeriesId: movie.id, type: 'tv_series', status: 'active' })
          .returning();
        const service = buildService();

        await service.set(asUser(user), movie.id, {});

        const [after] = await testDb.db
          .select()
          .from(bookmark)
          .where(eq(bookmark.id, tvBookmark.id));
        expect(after.status).toBe('active');
      });
    });

    describe('reco completion', () => {
      it('completes an active reco for the movie when the log is created', async () => {
        const { user: sender } = await createTestUser(testDb.db);
        const { user: receiver } = await createTestUser(testDb.db);
        await mutualFollow(sender.id, receiver.id);
        const movie = await createTestMovie(testDb.db);
        const recoService = new RecosService(
          testDb.db,
          createFakeNotifyClient(),
          fakeGateway(),
          new UserRecosService(testDb.db),
        );
        await recoService.send({
          user: asUser(sender),
          type: RecoType.MOVIE,
          mediaId: movie.id,
          dto: { userIds: [receiver.id] },
        });
        const service = buildService();

        await service.set(asUser(receiver), movie.id, {});

        const [row] = await testDb.db
          .select()
          .from(reco)
          .where(and(eq(reco.userId, receiver.id), eq(reco.movieId, movie.id)));
        expect(row.status).toBe('completed');
      });

      it('does not complete a reco sent for a different movie', async () => {
        const { user: sender } = await createTestUser(testDb.db);
        const { user: receiver } = await createTestUser(testDb.db);
        await mutualFollow(sender.id, receiver.id);
        const recommendedMovie = await createTestMovie(testDb.db);
        const loggedMovie = await createTestMovie(testDb.db);
        const recoService = new RecosService(
          testDb.db,
          createFakeNotifyClient(),
          fakeGateway(),
          new UserRecosService(testDb.db),
        );
        await recoService.send({
          user: asUser(sender),
          type: RecoType.MOVIE,
          mediaId: recommendedMovie.id,
          dto: { userIds: [receiver.id] },
        });
        const service = buildService();

        await service.set(asUser(receiver), loggedMovie.id, {});

        const [row] = await testDb.db
          .select()
          .from(reco)
          .where(and(eq(reco.userId, receiver.id), eq(reco.movieId, recommendedMovie.id)));
        expect(row.status).toBe('active');
      });

      it('only completes the logging user own received reco, not the sender history', async () => {
        const { user: sender } = await createTestUser(testDb.db);
        const { user: receiver } = await createTestUser(testDb.db);
        await mutualFollow(sender.id, receiver.id);
        const movie = await createTestMovie(testDb.db);
        const recoService = new RecosService(
          testDb.db,
          createFakeNotifyClient(),
          fakeGateway(),
          new UserRecosService(testDb.db),
        );
        await recoService.send({
          user: asUser(sender),
          type: RecoType.MOVIE,
          mediaId: movie.id,
          dto: { userIds: [receiver.id] },
        });
        const service = buildService();

        // The sender logging the movie they recommended must not complete the receiver's reco.
        await service.set(asUser(sender), movie.id, {});

        const [row] = await testDb.db
          .select()
          .from(reco)
          .where(and(eq(reco.userId, receiver.id), eq(reco.movieId, movie.id)));
        expect(row.status).toBe('active');
      });
    });
  });

  describe('delete', () => {
    it('throws when there is no log', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const service = buildService();

      await expect(service.delete(asUser(user), movie.id)).rejects.toThrow(NotFoundException);
    });

    it('deletes the log and emits MOVIE_LOG_DELETED', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const gateway = fakeGateway();
      const service = buildService(gateway);
      await service.set(asUser(user), movie.id, {});

      const result = await service.delete(asUser(user), movie.id);

      expect(result.movieId).toBe(movie.id);
      expect(gateway.emitToUser).toHaveBeenCalledWith(
        user.id,
        LogServerEvents.MOVIE_LOG_DELETED,
        result,
      );

      const rows = await testDb.db
        .select()
        .from(logMovie)
        .where(and(eq(logMovie.userId, user.id), eq(logMovie.movieId, movie.id)));
      expect(rows).toHaveLength(0);
    });

    it('does not revert an already-completed bookmark back to active', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const service = buildService();
      await testDb.db
        .insert(bookmark)
        .values({ userId: user.id, movieId: movie.id, type: 'movie', status: 'active' });
      await service.set(asUser(user), movie.id, {});

      await service.delete(asUser(user), movie.id);

      const [row] = await testDb.db
        .select()
        .from(bookmark)
        .where(and(eq(bookmark.userId, user.id), eq(bookmark.movieId, movie.id)));
      expect(row.status).toBe('completed');
    });
  });

  describe('getFollowingLogs', () => {
    it('only includes logs from accepted follows', async () => {
      const { user: viewer } = await createTestUser(testDb.db);
      const { user: accepted } = await createTestUser(testDb.db);
      const { user: pending } = await createTestUser(testDb.db);
      await testDb.db
        .insert(follow)
        .values({ followerId: viewer.id, followingId: accepted.id, status: 'accepted' });
      await testDb.db
        .insert(follow)
        .values({ followerId: viewer.id, followingId: pending.id, status: 'pending' });
      const movie = await createTestMovie(testDb.db);
      const service = buildService();
      await service.set(asUser(accepted), movie.id, { rating: 8 });
      await service.set(asUser(pending), movie.id, { rating: 2 });

      const result = await service.getFollowingLogs({
        currentUser: asUser(viewer),
        movieId: movie.id,
        dto: {},
      });

      expect(result.map((r) => r.user.id)).toEqual([accepted.id]);
    });

    it('filters by has_rating', async () => {
      const { user: viewer } = await createTestUser(testDb.db);
      const { user: rater } = await createTestUser(testDb.db);
      const { user: nonRater } = await createTestUser(testDb.db);
      await testDb.db
        .insert(follow)
        .values({ followerId: viewer.id, followingId: rater.id, status: 'accepted' });
      await testDb.db
        .insert(follow)
        .values({ followerId: viewer.id, followingId: nonRater.id, status: 'accepted' });
      const movie = await createTestMovie(testDb.db);
      const service = buildService();
      await service.set(asUser(rater), movie.id, { rating: 9 });
      await service.set(asUser(nonRater), movie.id, {});

      const result = await service.getFollowingLogs({
        currentUser: asUser(viewer),
        movieId: movie.id,
        dto: { has_rating: true },
      });

      expect(result.map((r) => r.user.id)).toEqual([rater.id]);
    });

    it('includes the review when the followed user wrote one', async () => {
      const { user: viewer } = await createTestUser(testDb.db);
      const { user: followed } = await createTestUser(testDb.db);
      await testDb.db
        .insert(follow)
        .values({ followerId: viewer.id, followingId: followed.id, status: 'accepted' });
      const movie = await createTestMovie(testDb.db);
      const service = buildService();
      await service.set(asUser(followed), movie.id, {});
      const [log] = await testDb.db
        .select()
        .from(logMovie)
        .where(and(eq(logMovie.userId, followed.id), eq(logMovie.movieId, movie.id)));
      await testDb.db.insert(reviewMovie).values({ id: log.id, body: 'Great movie' });

      const [result] = await service.getFollowingLogs({
        currentUser: asUser(viewer),
        movieId: movie.id,
        dto: {},
      });

      expect(result.review?.body).toBe('Great movie');
    });
  });

  describe('getFollowingAverageRating', () => {
    it('returns null when no followed user has rated the movie', async () => {
      const { user: viewer } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const service = buildService();

      const result = await service.getFollowingAverageRating({
        currentUser: asUser(viewer),
        movieId: movie.id,
      });

      expect(result.averageRating).toBeNull();
    });

    it('averages ratings from accepted follows only, rounded to one decimal', async () => {
      const { user: viewer } = await createTestUser(testDb.db);
      const { user: followedA } = await createTestUser(testDb.db);
      const { user: followedB } = await createTestUser(testDb.db);
      const { user: stranger } = await createTestUser(testDb.db);
      await testDb.db
        .insert(follow)
        .values({ followerId: viewer.id, followingId: followedA.id, status: 'accepted' });
      await testDb.db
        .insert(follow)
        .values({ followerId: viewer.id, followingId: followedB.id, status: 'accepted' });
      const movie = await createTestMovie(testDb.db);
      const service = buildService();
      await service.set(asUser(followedA), movie.id, { rating: 7 });
      await service.set(asUser(followedB), movie.id, { rating: 8 });
      await service.set(asUser(stranger), movie.id, { rating: 1 });

      const result = await service.getFollowingAverageRating({
        currentUser: asUser(viewer),
        movieId: movie.id,
      });

      expect(result.averageRating).toBe(7.5);
    });

    it('ignores unrated logs from followed users', async () => {
      const { user: viewer } = await createTestUser(testDb.db);
      const { user: rater } = await createTestUser(testDb.db);
      const { user: nonRater } = await createTestUser(testDb.db);
      await testDb.db
        .insert(follow)
        .values({ followerId: viewer.id, followingId: rater.id, status: 'accepted' });
      await testDb.db
        .insert(follow)
        .values({ followerId: viewer.id, followingId: nonRater.id, status: 'accepted' });
      const movie = await createTestMovie(testDb.db);
      const service = buildService();
      await service.set(asUser(rater), movie.id, { rating: 6 });
      await service.set(asUser(nonRater), movie.id, {});

      const result = await service.getFollowingAverageRating({
        currentUser: asUser(viewer),
        movieId: movie.id,
      });

      expect(result.averageRating).toBe(6);
    });
  });
});
