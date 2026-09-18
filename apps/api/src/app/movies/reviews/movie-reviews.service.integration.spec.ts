import { BadRequestException, NotFoundException } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { follow, profile, reviewMovie } from '@libs/db/schemas';
import {
  createTestMovie,
  createTestReviewMovie,
  createTestUser,
  TestDatabase,
} from '@libs/testing';
import { User } from '../../auth/auth.service';
import { LogServerEvents } from '@libs/realtime';
import type { RealtimeGateway } from '../../realtime/realtime.gateway';
import { ReviewMovieSortBy } from '../../reviews/movie/dto/reviews-movie.dto';
import { SortOrder } from '../../../common/dto/sort.dto';

jest.mock('../../realtime/realtime.gateway', () => ({ RealtimeGateway: jest.fn() }));

const { MovieReviewsService } =
  require('./movie-reviews.service') as typeof import('./movie-reviews.service');

describe('MovieReviewsService', () => {
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
    return new MovieReviewsService(testDb.db, gateway ?? fakeGateway());
  }

  const baseQuery = { sort_by: ReviewMovieSortBy.CREATED_AT, sort_order: SortOrder.ASC };

  describe('upsert', () => {
    it('throws when the movie has not been logged', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const service = buildService();

      await expect(
        service.upsert({
          user: asUser(user),
          movieId: movie.id,
          dto: { title: null, body: '  Great movie  ', isSpoiler: false },
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates a review, trimming the body', async () => {
      const { user } = await createTestUser(testDb.db);
      const { review, log } = await createTestReviewMovie(testDb.db, { userId: user.id });
      await testDb.db.delete(reviewMovie).where(eq(reviewMovie.id, review.id));
      const service = buildService();

      const result = await service.upsert({
        user: asUser(user),
        movieId: log.movieId,
        dto: { body: '  Great movie  ', title: 'My review', isSpoiler: false },
      });

      expect(result.body).toBe('Great movie');
      expect(result.title).toBe('My review');
      expect(result.movieId).toBe(log.movieId);
    });

    it('updates the existing review on a second call', async () => {
      const { user } = await createTestUser(testDb.db);
      const { log } = await createTestReviewMovie(testDb.db, { userId: user.id });
      const service = buildService();
      await service.upsert({
        user: asUser(user),
        movieId: log.movieId,
        dto: { title: null, body: 'First', isSpoiler: false },
      });

      const result = await service.upsert({
        user: asUser(user),
        movieId: log.movieId,
        dto: { title: null, body: 'Second', isSpoiler: true },
      });

      expect(result.body).toBe('Second');
      expect(result.isSpoiler).toBe(true);
      const rows = await testDb.db.select().from(reviewMovie).where(eq(reviewMovie.id, log.id));
      expect(rows).toHaveLength(1);
    });

    it('clears the title when omitted from the update', async () => {
      const { user } = await createTestUser(testDb.db);
      const { log } = await createTestReviewMovie(testDb.db, { userId: user.id });
      const service = buildService();
      await service.upsert({
        user: asUser(user),
        movieId: log.movieId,
        dto: { title: 'Has a title', body: 'x', isSpoiler: false },
      });

      const result = await service.upsert({
        user: asUser(user),
        movieId: log.movieId,
        dto: { title: null, body: 'x', isSpoiler: false },
      });

      expect(result.title).toBeNull();
    });

    it('emits a MOVIE_REVIEW_UPSERTED realtime event', async () => {
      const { user } = await createTestUser(testDb.db);
      const { log } = await createTestReviewMovie(testDb.db, { userId: user.id });
      const gateway = fakeGateway();
      const service = buildService(gateway);

      const result = await service.upsert({
        user: asUser(user),
        movieId: log.movieId,
        dto: { title: null, body: 'x', isSpoiler: false },
      });

      expect(gateway.emitToUser).toHaveBeenCalledWith(
        user.id,
        LogServerEvents.MOVIE_REVIEW_UPSERTED,
        result,
      );
    });
  });

  describe('delete', () => {
    it('throws when the movie has not been logged', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const service = buildService();

      await expect(service.delete({ user: asUser(user), movieId: movie.id })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws when there is no review to delete', async () => {
      const { user } = await createTestUser(testDb.db);
      const { log } = await createTestReviewMovie(testDb.db, { userId: user.id });
      await testDb.db.delete(reviewMovie).where(eq(reviewMovie.id, log.id));
      const service = buildService();

      await expect(service.delete({ user: asUser(user), movieId: log.movieId })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deletes the review and emits MOVIE_REVIEW_DELETED', async () => {
      const { user } = await createTestUser(testDb.db);
      const { log } = await createTestReviewMovie(testDb.db, { userId: user.id });
      const gateway = fakeGateway();
      const service = buildService(gateway);

      const result = await service.delete({ user: asUser(user), movieId: log.movieId });

      expect(gateway.emitToUser).toHaveBeenCalledWith(
        user.id,
        LogServerEvents.MOVIE_REVIEW_DELETED,
        result,
      );
      const rows = await testDb.db.select().from(reviewMovie).where(eq(reviewMovie.id, log.id));
      expect(rows).toHaveLength(0);
    });
  });

  describe('listPaginated / listInfinite - visibility', () => {
    it('shows a public author review to an anonymous viewer', async () => {
      const { user: author } = await createTestUser(testDb.db);
      const { log } = await createTestReviewMovie(testDb.db, { userId: author.id });
      const service = buildService();

      const result = await service.listPaginated({
        movieId: log.movieId,
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: null,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].author.id).toBe(author.id);
    });

    it('hides a private author review from an anonymous viewer', async () => {
      const { user: author } = await createTestUser(testDb.db);
      await testDb.db.update(profile).set({ isPrivate: true }).where(eq(profile.id, author.id));
      const { log } = await createTestReviewMovie(testDb.db, { userId: author.id });
      const service = buildService();

      const result = await service.listPaginated({
        movieId: log.movieId,
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: null,
      });

      expect(result.data).toEqual([]);
    });

    it('shows a private author own review to themself', async () => {
      const { user: author } = await createTestUser(testDb.db);
      await testDb.db.update(profile).set({ isPrivate: true }).where(eq(profile.id, author.id));
      const { log } = await createTestReviewMovie(testDb.db, { userId: author.id });
      const service = buildService();

      const result = await service.listPaginated({
        movieId: log.movieId,
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: asUser(author),
      });

      expect(result.data).toHaveLength(1);
    });

    it('hides a private author review from a non-follower', async () => {
      const { user: author } = await createTestUser(testDb.db);
      await testDb.db.update(profile).set({ isPrivate: true }).where(eq(profile.id, author.id));
      const { log } = await createTestReviewMovie(testDb.db, { userId: author.id });
      const { user: stranger } = await createTestUser(testDb.db);
      const service = buildService();

      const result = await service.listPaginated({
        movieId: log.movieId,
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: asUser(stranger),
      });

      expect(result.data).toEqual([]);
    });

    it('hides a private author review from a pending follower', async () => {
      const { user: author } = await createTestUser(testDb.db);
      await testDb.db.update(profile).set({ isPrivate: true }).where(eq(profile.id, author.id));
      const { log } = await createTestReviewMovie(testDb.db, { userId: author.id });
      const { user: follower } = await createTestUser(testDb.db);
      await testDb.db
        .insert(follow)
        .values({ followerId: follower.id, followingId: author.id, status: 'pending' });
      const service = buildService();

      const result = await service.listPaginated({
        movieId: log.movieId,
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: asUser(follower),
      });

      expect(result.data).toEqual([]);
    });

    it('shows a private author review to an accepted follower', async () => {
      const { user: author } = await createTestUser(testDb.db);
      await testDb.db.update(profile).set({ isPrivate: true }).where(eq(profile.id, author.id));
      const { log } = await createTestReviewMovie(testDb.db, { userId: author.id });
      const { user: follower } = await createTestUser(testDb.db);
      await testDb.db
        .insert(follow)
        .values({ followerId: follower.id, followingId: author.id, status: 'accepted' });
      const service = buildService();

      const result = await service.listPaginated({
        movieId: log.movieId,
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: asUser(follower),
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].author.id).toBe(author.id);
    });
  });

  describe('listPaginated / listInfinite - sorting and pagination', () => {
    it('includes the reviewer rating alongside the review', async () => {
      const { user } = await createTestUser(testDb.db);
      const { log } = await createTestReviewMovie(testDb.db, { userId: user.id }, {});
      // Rating lives on logMovie, not reviewMovie — set directly for the assertion.
      await testDb.db.execute(sql`UPDATE log_movie SET rating = 9 WHERE id = ${log.id}`);
      const service = buildService();

      const result = await service.listPaginated({
        movieId: log.movieId,
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: null,
      });

      expect(result.data[0].rating).toBe(9);
    });

    it('paginates results and reports accurate meta', async () => {
      const movie = await createTestMovie(testDb.db);
      const reviewers = [];
      for (let i = 0; i < 3; i++) {
        const { user } = await createTestUser(testDb.db);
        await createTestReviewMovie(testDb.db, { userId: user.id, movieId: movie.id });
        reviewers.push(user);
      }
      const service = buildService();

      const page1 = await service.listPaginated({
        movieId: movie.id,
        query: { ...baseQuery, page: 1, per_page: 2 },
        currentUser: null,
      });
      expect(page1.data).toHaveLength(2);
      expect(page1.meta).toEqual({
        total_results: 3,
        total_pages: 2,
        current_page: 1,
        per_page: 2,
      });
    });

    it('paginates with a cursor until there is no next page', async () => {
      const movie = await createTestMovie(testDb.db);
      for (let i = 0; i < 3; i++) {
        const { user } = await createTestUser(testDb.db);
        await createTestReviewMovie(testDb.db, { userId: user.id, movieId: movie.id });
      }
      const service = buildService();

      const firstPage = await service.listInfinite({
        movieId: movie.id,
        query: { ...baseQuery, per_page: 2 },
        currentUser: null,
      });
      expect(firstPage.data).toHaveLength(2);
      expect(firstPage.meta.next_cursor).not.toBeNull();

      const secondPage = await service.listInfinite({
        movieId: movie.id,
        query: { ...baseQuery, per_page: 2, cursor: firstPage.meta.next_cursor ?? undefined },
        currentUser: null,
      });
      expect(secondPage.data).toHaveLength(1);
      expect(secondPage.meta.next_cursor).toBeNull();
    });

    it('sorts by likes_count', async () => {
      const movie = await createTestMovie(testDb.db);
      const { user: lessLiked } = await createTestUser(testDb.db);
      const { user: moreLiked } = await createTestUser(testDb.db);
      const { log: lessLog } = await createTestReviewMovie(testDb.db, {
        userId: lessLiked.id,
        movieId: movie.id,
      });
      const { log: moreLog } = await createTestReviewMovie(testDb.db, {
        userId: moreLiked.id,
        movieId: movie.id,
      });
      await testDb.db
        .update(reviewMovie)
        .set({ likesCount: 5 })
        .where(eq(reviewMovie.id, moreLog.id));
      await testDb.db
        .update(reviewMovie)
        .set({ likesCount: 1 })
        .where(eq(reviewMovie.id, lessLog.id));
      const service = buildService();

      const result = await service.listInfinite({
        movieId: movie.id,
        query: { sort_by: ReviewMovieSortBy.LIKES_COUNT, sort_order: SortOrder.DESC, per_page: 10 },
        currentUser: null,
      });

      expect(result.data.map((r) => r.userId)).toEqual([moreLiked.id, lessLiked.id]);
    });

    it('does not throw when sorting randomly', async () => {
      const movie = await createTestMovie(testDb.db);
      const { user } = await createTestUser(testDb.db);
      await createTestReviewMovie(testDb.db, { userId: user.id, movieId: movie.id });
      const service = buildService();

      const result = await service.listPaginated({
        movieId: movie.id,
        query: {
          sort_by: ReviewMovieSortBy.RANDOM,
          sort_order: SortOrder.ASC,
          page: 1,
          per_page: 10,
        },
        currentUser: null,
      });

      expect(result.data).toHaveLength(1);
    });

    it('rejects a cursor that is not valid base64-encoded JSON', async () => {
      const movie = await createTestMovie(testDb.db);
      const service = buildService();

      await expect(
        service.listInfinite({
          movieId: movie.id,
          query: { ...baseQuery, per_page: 10, cursor: 'not-a-valid-cursor' },
          currentUser: null,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
