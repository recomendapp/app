import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import {
  feed,
  follow,
  logMovie,
  logTvSeries,
  playlistLike,
  profile,
  reviewMovieLike,
  reviewTvSeriesLike,
} from '@libs/db/schemas';
import {
  createTestLogMovie,
  createTestLogTvSeries,
  createTestMovie,
  createTestPlaylist,
  createTestPlaylistLike,
  createTestReviewMovie,
  createTestReviewMovieLike,
  createTestReviewTvSeries,
  createTestReviewTvSeriesLike,
  createTestTvSeries,
  createTestUser,
  TestDatabase,
} from '@libs/testing';
import { defaultSupportedLocale } from '@libs/i18n';
import { User } from '../auth/auth.service';
import { FeedService } from './feed.service';
import {
  FeedItemLogMovieDto,
  FeedItemLogTvSeriesDto,
  FeedItemPlaylistLikeDto,
  FeedItemReviewMovieLikeDto,
  FeedItemReviewTvSeriesLikeDto,
} from './feed.dto';

describe('FeedService', () => {
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

  async function getFeedRow(activityType: string, activityId: number) {
    const [row] = await testDb.db
      .select()
      .from(feed)
      .where(and(eq(feed.activityType, activityType as never), eq(feed.activityId, activityId)));
    return row;
  }

  /* -------------------------------------------------------------------------- */
  /* Trigger sync: feed row appears/disappears with the underlying activity row */
  /* -------------------------------------------------------------------------- */
  describe('activity trigger sync', () => {
    it('adds a feed row when a movie is logged, and removes it when the log is deleted', async () => {
      const { user } = await createTestUser(testDb.db);
      const log = await createTestLogMovie(testDb.db, { userId: user.id });

      const created = await getFeedRow('log_movie', log.id);
      expect(created).toBeDefined();
      expect(created?.userId).toBe(user.id);

      await testDb.db.delete(logMovie).where(eq(logMovie.id, log.id));

      const afterDelete = await getFeedRow('log_movie', log.id);
      expect(afterDelete).toBeUndefined();
    });

    it('adds a feed row when a tv series is logged, and removes it when the log is deleted', async () => {
      const { user } = await createTestUser(testDb.db);
      const log = await createTestLogTvSeries(testDb.db, { userId: user.id });

      const created = await getFeedRow('log_tv_series', log.id);
      expect(created).toBeDefined();
      expect(created?.userId).toBe(user.id);

      await testDb.db.delete(logTvSeries).where(eq(logTvSeries.id, log.id));

      const afterDelete = await getFeedRow('log_tv_series', log.id);
      expect(afterDelete).toBeUndefined();
    });

    it('adds a feed row when a review is liked, and it shows up in the liker feed', async () => {
      const { user: author } = await createTestUser(testDb.db);
      const { user: liker } = await createTestUser(testDb.db);
      const { review } = await createTestReviewMovie(testDb.db, { userId: author.id });
      const service = new FeedService(testDb.db);

      const like = await createTestReviewMovieLike(testDb.db, {
        reviewId: review.id,
        userId: liker.id,
      });

      const created = await getFeedRow('review_movie_like', like.id);
      expect(created).toBeDefined();
      expect(created?.userId).toBe(liker.id);

      const feedForLiker = await service.listPaginated({
        query: { per_page: 10, page: 1 },
        currentUser: asUser(liker),
        locale: defaultSupportedLocale,
      });
      expect(feedForLiker.data.map((i) => i.activityId)).toContain(like.id);
    });

    it('adds a feed row when a tv series review is liked, and removes it when the like is removed', async () => {
      const { user: author } = await createTestUser(testDb.db);
      const { user: liker } = await createTestUser(testDb.db);
      const { review } = await createTestReviewTvSeries(testDb.db, { userId: author.id });

      const like = await createTestReviewTvSeriesLike(testDb.db, {
        reviewId: review.id,
        userId: liker.id,
      });

      const created = await getFeedRow('review_tv_series_like', like.id);
      expect(created).toBeDefined();
      expect(created?.userId).toBe(liker.id);
    });

    it('adds a feed row when a playlist is liked, and removes it when the like is removed', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: liker } = await createTestUser(testDb.db);
      const playlist = await createTestPlaylist(testDb.db, { userId: owner.id });

      const like = await createTestPlaylistLike(testDb.db, {
        playlistId: playlist.id,
        userId: liker.id,
      });

      const created = await getFeedRow('playlist_like', like.id);
      expect(created).toBeDefined();
      expect(created?.userId).toBe(liker.id);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* Removal via delete for each type (explicit "add then remove" per action)   */
  /* -------------------------------------------------------------------------- */
  describe('activity removal', () => {
    it('removes the feed row when a review_movie_like is deleted', async () => {
      const { user: author } = await createTestUser(testDb.db);
      const { user: liker } = await createTestUser(testDb.db);
      const { review } = await createTestReviewMovie(testDb.db, { userId: author.id });

      const like = await createTestReviewMovieLike(testDb.db, {
        reviewId: review.id,
        userId: liker.id,
      });
      expect(await getFeedRow('review_movie_like', like.id)).toBeDefined();

      await testDb.db.delete(reviewMovieLike).where(eq(reviewMovieLike.id, like.id));
      expect(await getFeedRow('review_movie_like', like.id)).toBeUndefined();
    });

    it('removes the feed row when a review_tv_series_like is deleted', async () => {
      const { user: author } = await createTestUser(testDb.db);
      const { user: liker } = await createTestUser(testDb.db);
      const { review } = await createTestReviewTvSeries(testDb.db, { userId: author.id });

      const like = await createTestReviewTvSeriesLike(testDb.db, {
        reviewId: review.id,
        userId: liker.id,
      });
      expect(await getFeedRow('review_tv_series_like', like.id)).toBeDefined();

      await testDb.db.delete(reviewTvSeriesLike).where(eq(reviewTvSeriesLike.id, like.id));
      expect(await getFeedRow('review_tv_series_like', like.id)).toBeUndefined();
    });

    it('removes the feed row when a playlist_like is deleted', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: liker } = await createTestUser(testDb.db);
      const playlistRow = await createTestPlaylist(testDb.db, { userId: owner.id });

      const like = await createTestPlaylistLike(testDb.db, {
        playlistId: playlistRow.id,
        userId: liker.id,
      });
      expect(await getFeedRow('playlist_like', like.id)).toBeDefined();

      await testDb.db.delete(playlistLike).where(eq(playlistLike.id, like.id));
      expect(await getFeedRow('playlist_like', like.id)).toBeUndefined();
    });
  });

  /* -------------------------------------------------------------------------- */
  /* Content shape per activity type                                           */
  /* -------------------------------------------------------------------------- */
  describe('content per activity type', () => {
    it('builds log_movie content without a review', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const log = await createTestLogMovie(testDb.db, { userId: user.id, movieId: movie.id });
      const service = new FeedService(testDb.db);

      const result = await service.listPaginated({
        query: { per_page: 10, page: 1 },
        currentUser: asUser(user),
        locale: defaultSupportedLocale,
      });

      const item = result.data.find((i) => i.activityId === log.id) as FeedItemLogMovieDto;
      expect(item).toBeDefined();
      expect(item.activityType).toBe('log_movie');
      expect(item.author.id).toBe(user.id);
      expect(item.content.id).toBe(log.id);
      expect(item.content.movie.id).toBe(movie.id);
      expect(item.content.review).toBeNull();
    });

    it('builds log_movie content with its review attached', async () => {
      const { user } = await createTestUser(testDb.db);
      const { log, review } = await createTestReviewMovie(testDb.db, { userId: user.id });
      const service = new FeedService(testDb.db);

      const result = await service.listPaginated({
        query: { per_page: 10, page: 1 },
        currentUser: asUser(user),
        locale: defaultSupportedLocale,
      });

      const item = result.data.find((i) => i.activityId === log.id) as FeedItemLogMovieDto;
      expect(item.content.review).not.toBeNull();
      expect(item.content.review?.id).toBe(review.id);
      expect(item.content.review?.body).toBe(review.body);
      expect(item.content.review?.movieId).toBe(log.movieId);
    });

    it('builds log_tv_series content without a review', async () => {
      const { user } = await createTestUser(testDb.db);
      const tvSeries = await createTestTvSeries(testDb.db);
      const log = await createTestLogTvSeries(testDb.db, {
        userId: user.id,
        tvSeriesId: tvSeries.id,
      });
      const service = new FeedService(testDb.db);

      const result = await service.listPaginated({
        query: { per_page: 10, page: 1 },
        currentUser: asUser(user),
        locale: defaultSupportedLocale,
      });

      const item = result.data.find((i) => i.activityId === log.id) as FeedItemLogTvSeriesDto;
      expect(item.activityType).toBe('log_tv_series');
      expect(item.content.tvSeries.id).toBe(tvSeries.id);
      expect(item.content.review).toBeNull();
    });

    it('builds log_tv_series content with its review attached', async () => {
      const { user } = await createTestUser(testDb.db);
      const { log, review } = await createTestReviewTvSeries(testDb.db, { userId: user.id });
      const service = new FeedService(testDb.db);

      const result = await service.listPaginated({
        query: { per_page: 10, page: 1 },
        currentUser: asUser(user),
        locale: defaultSupportedLocale,
      });

      const item = result.data.find((i) => i.activityId === log.id) as FeedItemLogTvSeriesDto;
      expect(item.content.review).not.toBeNull();
      expect(item.content.review?.id).toBe(review.id);
      expect(item.content.review?.tvSeriesId).toBe(log.tvSeriesId);
    });

    it('builds review_movie_like content with the review author, not the liker', async () => {
      const { user: author } = await createTestUser(testDb.db);
      const { user: liker } = await createTestUser(testDb.db);
      const { review, log } = await createTestReviewMovie(testDb.db, { userId: author.id });
      const like = await createTestReviewMovieLike(testDb.db, {
        reviewId: review.id,
        userId: liker.id,
      });
      const service = new FeedService(testDb.db);

      const result = await service.listPaginated({
        query: { per_page: 10, page: 1 },
        currentUser: asUser(liker),
        locale: defaultSupportedLocale,
      });

      const item = result.data.find((i) => i.activityId === like.id) as FeedItemReviewMovieLikeDto;
      expect(item).toBeDefined();
      expect(item.author.id).toBe(liker.id); // the feed entry belongs to the liker...
      expect(item.content.id).toBe(review.id);
      expect(item.content.movieId).toBe(log.movieId);
      expect(item.content.movie.id).toBe(log.movieId);
      expect((item.content as unknown as { author: { id: string } }).author.id).toBe(author.id); // ...but content.author is the review's author
    });

    it('builds review_tv_series_like content with the review author, not the liker', async () => {
      const { user: author } = await createTestUser(testDb.db);
      const { user: liker } = await createTestUser(testDb.db);
      const { review, log } = await createTestReviewTvSeries(testDb.db, { userId: author.id });
      const like = await createTestReviewTvSeriesLike(testDb.db, {
        reviewId: review.id,
        userId: liker.id,
      });
      const service = new FeedService(testDb.db);

      const result = await service.listPaginated({
        query: { per_page: 10, page: 1 },
        currentUser: asUser(liker),
        locale: defaultSupportedLocale,
      });

      const item = result.data.find(
        (i) => i.activityId === like.id,
      ) as FeedItemReviewTvSeriesLikeDto;
      expect(item).toBeDefined();
      expect(item.content.id).toBe(review.id);
      expect(item.content.tvSeriesId).toBe(log.tvSeriesId);
      expect(item.content.tvSeries.id).toBe(log.tvSeriesId);
      expect((item.content as unknown as { author: { id: string } }).author.id).toBe(author.id);
    });

    it('builds playlist_like content with the "owner" role for the playlist owner', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: liker } = await createTestUser(testDb.db);
      const playlistRow = await createTestPlaylist(
        testDb.db,
        { userId: owner.id },
        { title: 'My Watchlist' },
      );
      const like = await createTestPlaylistLike(testDb.db, {
        playlistId: playlistRow.id,
        userId: liker.id,
      });
      const service = new FeedService(testDb.db);

      const result = await service.listPaginated({
        query: { per_page: 10, page: 1 },
        currentUser: asUser(owner),
        locale: defaultSupportedLocale,
        targetUserId: liker.id,
      });

      const item = result.data.find((i) => i.activityId === like.id) as FeedItemPlaylistLikeDto;
      expect(item).toBeDefined();
      expect(item.author.id).toBe(liker.id);
      expect(item.content.id).toBe(playlistRow.id);
      expect(item.content.title).toBe('My Watchlist');
      expect((item.content as unknown as { role: string }).role).toBe('owner');
    });
  });

  /* -------------------------------------------------------------------------- */
  /* Own feed (no targetUserId)                                                 */
  /* -------------------------------------------------------------------------- */
  describe('listPaginated / listInfinite - own feed', () => {
    it('throws when unauthenticated', async () => {
      const service = new FeedService(testDb.db);

      await expect(
        service.listPaginated({
          query: { per_page: 10, page: 1 },
          currentUser: null,
          locale: defaultSupportedLocale,
        }),
      ).rejects.toThrow(UnauthorizedException);

      await expect(
        service.listInfinite({
          query: { per_page: 10 },
          currentUser: null,
          locale: defaultSupportedLocale,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('includes the current user own activity', async () => {
      const { user } = await createTestUser(testDb.db);
      const log = await createTestLogMovie(testDb.db, { userId: user.id });
      const service = new FeedService(testDb.db);

      const result = await service.listPaginated({
        query: { per_page: 10, page: 1 },
        currentUser: asUser(user),
        locale: defaultSupportedLocale,
      });

      expect(result.data.map((i) => i.activityId)).toContain(log.id);
    });

    it('includes activity from an accepted-follow, but not a stranger or a pending follow', async () => {
      const { user: viewer } = await createTestUser(testDb.db);
      const { user: accepted } = await createTestUser(testDb.db);
      const { user: pending } = await createTestUser(testDb.db);
      const { user: stranger } = await createTestUser(testDb.db);

      await testDb.db
        .insert(follow)
        .values({ followerId: viewer.id, followingId: accepted.id, status: 'accepted' });
      await testDb.db
        .insert(follow)
        .values({ followerId: viewer.id, followingId: pending.id, status: 'pending' });

      const acceptedLog = await createTestLogMovie(testDb.db, { userId: accepted.id });
      const pendingLog = await createTestLogMovie(testDb.db, { userId: pending.id });
      const strangerLog = await createTestLogMovie(testDb.db, { userId: stranger.id });

      const service = new FeedService(testDb.db);
      const result = await service.listPaginated({
        query: { per_page: 10, page: 1 },
        currentUser: asUser(viewer),
        locale: defaultSupportedLocale,
      });

      const activityIds = result.data.map((i) => i.activityId);
      expect(activityIds).toContain(acceptedLog.id);
      expect(activityIds).not.toContain(pendingLog.id);
      expect(activityIds).not.toContain(strangerLog.id);
    });

    it('filters by activity_type', async () => {
      const { user } = await createTestUser(testDb.db);
      const movieLog = await createTestLogMovie(testDb.db, { userId: user.id });
      await createTestLogTvSeries(testDb.db, { userId: user.id });
      const service = new FeedService(testDb.db);

      const result = await service.listPaginated({
        query: { per_page: 10, page: 1, activity_type: 'log_movie' },
        currentUser: asUser(user),
        locale: defaultSupportedLocale,
      });

      // `log_movie` and `log_tv_series` ids are independent identity
      // sequences, so they can collide numerically — assert on the
      // (activityType, activityId) pair, not the bare id.
      expect(
        result.data.some((i) => i.activityType === 'log_movie' && i.activityId === movieLog.id),
      ).toBe(true);
      expect(result.data.some((i) => i.activityType === 'log_tv_series')).toBe(false);
      expect(result.data.every((i) => i.activityType === 'log_movie')).toBe(true);
    });

    it('paginates results and reports accurate meta', async () => {
      const { user } = await createTestUser(testDb.db);
      const logs = [];
      for (let i = 0; i < 3; i++) {
        logs.push(await createTestLogMovie(testDb.db, { userId: user.id }));
      }
      const service = new FeedService(testDb.db);

      const page1 = await service.listPaginated({
        query: { per_page: 2, page: 1 },
        currentUser: asUser(user),
        locale: defaultSupportedLocale,
      });
      expect(page1.data).toHaveLength(2);
      expect(page1.meta).toEqual({
        total_results: 3,
        total_pages: 2,
        current_page: 1,
        per_page: 2,
      });
      // Most recent first (desc createdAt, desc id): last-created log leads.
      expect(page1.data[0].activityId).toBe(logs[2].id);

      const page2 = await service.listPaginated({
        query: { per_page: 2, page: 2 },
        currentUser: asUser(user),
        locale: defaultSupportedLocale,
      });
      expect(page2.data).toHaveLength(1);
      expect(page2.data[0].activityId).toBe(logs[0].id);
    });

    it('paginates with a cursor until there is no next page', async () => {
      const { user } = await createTestUser(testDb.db);
      const logs = [];
      for (let i = 0; i < 3; i++) {
        logs.push(await createTestLogMovie(testDb.db, { userId: user.id }));
      }
      const service = new FeedService(testDb.db);

      const firstPage = await service.listInfinite({
        query: { per_page: 2 },
        currentUser: asUser(user),
        locale: defaultSupportedLocale,
      });
      expect(firstPage.data.map((i) => i.activityId)).toEqual([logs[2].id, logs[1].id]);
      expect(firstPage.meta.next_cursor).not.toBeNull();

      const secondPage = await service.listInfinite({
        query: { per_page: 2, cursor: firstPage.meta.next_cursor ?? undefined },
        currentUser: asUser(user),
        locale: defaultSupportedLocale,
      });
      expect(secondPage.data.map((i) => i.activityId)).toEqual([logs[0].id]);
      expect(secondPage.meta.next_cursor).toBeNull();
    });

    it('rejects a malformed cursor', async () => {
      const { user } = await createTestUser(testDb.db);
      const service = new FeedService(testDb.db);

      await expect(
        service.listInfinite({
          query: { per_page: 10, cursor: 'not-a-valid-cursor' },
          currentUser: asUser(user),
          locale: defaultSupportedLocale,
        }),
      ).rejects.toThrow();
    });
  });

  /* -------------------------------------------------------------------------- */
  /* Someone else's feed (targetUserId)                                        */
  /* -------------------------------------------------------------------------- */
  describe('listPaginated / listInfinite - target user feed', () => {
    it('throws when the target user does not exist', async () => {
      const service = new FeedService(testDb.db);

      await expect(
        service.listPaginated({
          query: { per_page: 10, page: 1 },
          currentUser: null,
          locale: defaultSupportedLocale,
          targetUserId: '00000000-0000-0000-0000-000000000000',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('lets an anonymous viewer see a public profile feed', async () => {
      const { user: target } = await createTestUser(testDb.db);
      const log = await createTestLogMovie(testDb.db, { userId: target.id });
      const service = new FeedService(testDb.db);

      const result = await service.listPaginated({
        query: { per_page: 10, page: 1 },
        currentUser: null,
        locale: defaultSupportedLocale,
        targetUserId: target.id,
      });

      expect(result.data.map((i) => i.activityId)).toContain(log.id);
    });

    it('hides a private profile feed from an anonymous viewer', async () => {
      const { user: target } = await createTestUser(testDb.db);
      await testDb.db.update(profile).set({ isPrivate: true }).where(eq(profile.id, target.id));
      await createTestLogMovie(testDb.db, { userId: target.id });
      const service = new FeedService(testDb.db);

      await expect(
        service.listPaginated({
          query: { per_page: 10, page: 1 },
          currentUser: null,
          locale: defaultSupportedLocale,
          targetUserId: target.id,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('hides a private profile feed from a non-follower', async () => {
      const { user: target } = await createTestUser(testDb.db);
      await testDb.db.update(profile).set({ isPrivate: true }).where(eq(profile.id, target.id));
      const { user: stranger } = await createTestUser(testDb.db);
      const service = new FeedService(testDb.db);

      await expect(
        service.listPaginated({
          query: { per_page: 10, page: 1 },
          currentUser: asUser(stranger),
          locale: defaultSupportedLocale,
          targetUserId: target.id,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('hides a private profile feed from a pending follower', async () => {
      const { user: target } = await createTestUser(testDb.db);
      await testDb.db.update(profile).set({ isPrivate: true }).where(eq(profile.id, target.id));
      const { user: follower } = await createTestUser(testDb.db);
      await testDb.db
        .insert(follow)
        .values({ followerId: follower.id, followingId: target.id, status: 'pending' });
      const service = new FeedService(testDb.db);

      await expect(
        service.listPaginated({
          query: { per_page: 10, page: 1 },
          currentUser: asUser(follower),
          locale: defaultSupportedLocale,
          targetUserId: target.id,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('shows a private profile feed to an accepted follower', async () => {
      const { user: target } = await createTestUser(testDb.db);
      await testDb.db.update(profile).set({ isPrivate: true }).where(eq(profile.id, target.id));
      const log = await createTestLogMovie(testDb.db, { userId: target.id });
      const { user: follower } = await createTestUser(testDb.db);
      await testDb.db
        .insert(follow)
        .values({ followerId: follower.id, followingId: target.id, status: 'accepted' });
      const service = new FeedService(testDb.db);

      const result = await service.listPaginated({
        query: { per_page: 10, page: 1 },
        currentUser: asUser(follower),
        locale: defaultSupportedLocale,
        targetUserId: target.id,
      });

      expect(result.data.map((i) => i.activityId)).toContain(log.id);
    });

    it('always lets a user view their own feed even when their profile is private', async () => {
      const { user: target } = await createTestUser(testDb.db);
      await testDb.db.update(profile).set({ isPrivate: true }).where(eq(profile.id, target.id));
      const log = await createTestLogMovie(testDb.db, { userId: target.id });
      const service = new FeedService(testDb.db);

      const result = await service.listPaginated({
        query: { per_page: 10, page: 1 },
        currentUser: asUser(target),
        locale: defaultSupportedLocale,
        targetUserId: target.id,
      });

      expect(result.data.map((i) => i.activityId)).toContain(log.id);
    });

    it('scopes the feed strictly to the target user, excluding people they follow', async () => {
      const { user: target } = await createTestUser(testDb.db);
      const { user: followedByTarget } = await createTestUser(testDb.db);
      await testDb.db
        .insert(follow)
        .values({ followerId: target.id, followingId: followedByTarget.id, status: 'accepted' });

      const targetLog = await createTestLogMovie(testDb.db, { userId: target.id });
      const followedLog = await createTestLogMovie(testDb.db, { userId: followedByTarget.id });
      const service = new FeedService(testDb.db);

      const result = await service.listPaginated({
        query: { per_page: 10, page: 1 },
        currentUser: null,
        locale: defaultSupportedLocale,
        targetUserId: target.id,
      });

      const activityIds = result.data.map((i) => i.activityId);
      expect(activityIds).toContain(targetLog.id);
      expect(activityIds).not.toContain(followedLog.id);
    });
  });
});
