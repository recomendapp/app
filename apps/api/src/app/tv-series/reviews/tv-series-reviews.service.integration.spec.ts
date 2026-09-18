import { NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { follow, logTvSeries, profile, reviewTvSeries } from '@libs/db/schemas';
import { createTestTvSeries, createTestUser, TestDatabase } from '@libs/testing';
import { LogServerEvents } from '@libs/realtime';
import type { RealtimeGateway } from '../../realtime/realtime.gateway';
import { User } from '../../auth/auth.service';
import { ReviewTvSeriesSortBy } from '../../reviews/tv-series/dto/review-tv-series.dto';
import { SortOrder } from '../../../common/dto/sort.dto';

jest.mock('../../realtime/realtime.gateway', () => ({ RealtimeGateway: jest.fn() }));

const { TvSeriesReviewsService } =
  require('./tv-series-reviews.service') as typeof import('./tv-series-reviews.service');

describe('TvSeriesReviewsService', () => {
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
  const fakeGateway = () =>
    ({ emitToUser: jest.fn(), emitToUsers: jest.fn() }) as unknown as jest.Mocked<RealtimeGateway>;
  const service = (gateway?: jest.Mocked<RealtimeGateway>) =>
    new TvSeriesReviewsService(testDb.db, gateway ?? fakeGateway());

  async function addLog(userId: string, tvSeriesId: number, rating?: number) {
    const [log] = await testDb.db
      .insert(logTvSeries)
      .values({ userId, tvSeriesId, status: 'watching', rating })
      .returning();
    return log;
  }

  describe('upsert', () => {
    it('throws when there is no log entry for that user/series', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db);

      await expect(
        service().upsert({
          user: asUser(user),
          tvSeriesId: series.id,
          dto: { title: null, body: 'Great show', isSpoiler: false },
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates a review when a log entry exists', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db);
      await addLog(user.id, series.id);

      const result = await service().upsert({
        user: asUser(user),
        tvSeriesId: series.id,
        dto: { title: 'My take', body: 'Great show', isSpoiler: false },
      });

      expect(result.body).toBe('Great show');
      expect(result.title).toBe('My take');
    });

    it('updates the existing review on a second call', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db);
      await addLog(user.id, series.id);
      await service().upsert({
        user: asUser(user),
        tvSeriesId: series.id,
        dto: { title: null, body: 'First draft', isSpoiler: false },
      });

      const result = await service().upsert({
        user: asUser(user),
        tvSeriesId: series.id,
        dto: { title: null, body: 'Final version', isSpoiler: true },
      });

      expect(result.body).toBe('Final version');
      expect(result.isSpoiler).toBe(true);
      const rows = await testDb.db.select().from(reviewTvSeries);
      expect(rows).toHaveLength(1);
    });

    it('trims the review body', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db);
      await addLog(user.id, series.id);

      const result = await service().upsert({
        user: asUser(user),
        tvSeriesId: series.id,
        dto: { title: null, body: '  padded  ', isSpoiler: false },
      });

      expect(result.body).toBe('padded');
    });

    it('broadcasts a TV_SERIES_REVIEW_UPSERTED event', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db);
      await addLog(user.id, series.id);
      const gateway = fakeGateway();

      await service(gateway).upsert({
        user: asUser(user),
        tvSeriesId: series.id,
        dto: { title: null, body: 'Great show', isSpoiler: false },
      });

      expect(gateway.emitToUser).toHaveBeenCalledWith(
        user.id,
        LogServerEvents.TV_SERIES_REVIEW_UPSERTED,
        expect.anything(),
      );
    });
  });

  describe('delete', () => {
    it('throws when there is no log entry', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db);

      await expect(service().delete({ user: asUser(user), tvSeriesId: series.id })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws when the log entry has no review', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db);
      await addLog(user.id, series.id);

      await expect(service().delete({ user: asUser(user), tvSeriesId: series.id })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deletes the review and broadcasts a TV_SERIES_REVIEW_DELETED event', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db);
      await addLog(user.id, series.id);
      const gateway = fakeGateway();
      await service(gateway).upsert({
        user: asUser(user),
        tvSeriesId: series.id,
        dto: { title: null, body: 'Great show', isSpoiler: false },
      });

      await service(gateway).delete({ user: asUser(user), tvSeriesId: series.id });

      const rows = await testDb.db.select().from(reviewTvSeries);
      expect(rows).toEqual([]);
      expect(gateway.emitToUser).toHaveBeenCalledWith(
        user.id,
        LogServerEvents.TV_SERIES_REVIEW_DELETED,
        expect.anything(),
      );
    });
  });

  describe('listPaginated', () => {
    const baseQuery = { sort_by: ReviewTvSeriesSortBy.CREATED_AT, sort_order: SortOrder.DESC };

    it('hides a review from a private profile to an anonymous viewer', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db);
      await addLog(user.id, series.id);
      await service().upsert({
        user: asUser(user),
        tvSeriesId: series.id,
        dto: { title: null, body: 'Hidden', isSpoiler: false },
      });
      await testDb.db.update(profile).set({ isPrivate: true }).where(eq(profile.id, user.id));

      const result = await service().listPaginated({
        tvSeriesId: series.id,
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: null,
      });

      expect(result.data).toEqual([]);
    });

    it('shows a review from a private profile to the author themselves', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db);
      await addLog(user.id, series.id);
      await service().upsert({
        user: asUser(user),
        tvSeriesId: series.id,
        dto: { title: null, body: 'Mine', isSpoiler: false },
      });
      await testDb.db.update(profile).set({ isPrivate: true }).where(eq(profile.id, user.id));

      const result = await service().listPaginated({
        tvSeriesId: series.id,
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: asUser(user),
      });

      expect(result.data.map((r) => r.userId)).toEqual([user.id]);
    });

    it('shows a review from a private profile to an accepted follower', async () => {
      const { user: author } = await createTestUser(testDb.db);
      const { user: follower } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db);
      await addLog(author.id, series.id);
      await service().upsert({
        user: asUser(author),
        tvSeriesId: series.id,
        dto: { title: null, body: 'Followers only', isSpoiler: false },
      });
      await testDb.db.update(profile).set({ isPrivate: true }).where(eq(profile.id, author.id));
      await testDb.db
        .insert(follow)
        .values({ followerId: follower.id, followingId: author.id, status: 'accepted' });

      const result = await service().listPaginated({
        tvSeriesId: series.id,
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: asUser(follower),
      });

      expect(result.data.map((r) => r.userId)).toEqual([author.id]);
    });

    it('paginates results and reports accurate meta', async () => {
      const series = await createTestTvSeries(testDb.db);
      for (let i = 0; i < 3; i++) {
        const { user } = await createTestUser(testDb.db);
        await addLog(user.id, series.id);
        await service().upsert({
          user: asUser(user),
          tvSeriesId: series.id,
          dto: { title: null, body: `Review ${i}`, isSpoiler: false },
        });
      }

      const page1 = await service().listPaginated({
        tvSeriesId: series.id,
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
  });

  describe('listInfinite', () => {
    const baseQuery = { sort_by: ReviewTvSeriesSortBy.CREATED_AT, sort_order: SortOrder.DESC };

    it('paginates with a cursor until there is no next page', async () => {
      const series = await createTestTvSeries(testDb.db);
      for (let i = 0; i < 3; i++) {
        const { user } = await createTestUser(testDb.db);
        await addLog(user.id, series.id);
        await service().upsert({
          user: asUser(user),
          tvSeriesId: series.id,
          dto: { title: null, body: `Review ${i}`, isSpoiler: false },
        });
      }

      const firstPage = await service().listInfinite({
        tvSeriesId: series.id,
        query: { ...baseQuery, per_page: 2 },
        currentUser: null,
      });
      expect(firstPage.data).toHaveLength(2);
      expect(firstPage.meta.next_cursor).not.toBeNull();

      const secondPage = await service().listInfinite({
        tvSeriesId: series.id,
        query: { ...baseQuery, per_page: 2, cursor: firstPage.meta.next_cursor ?? undefined },
        currentUser: null,
      });
      expect(secondPage.data).toHaveLength(1);
      expect(secondPage.meta.next_cursor).toBeNull();
    });
  });
});
