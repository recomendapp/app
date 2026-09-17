import { BadRequestException } from '@nestjs/common';
import { reco } from '@libs/db/schemas';
import { createTestMovie, createTestTvSeries, createTestUser, TestDatabase } from '@libs/testing';
import { defaultSupportedLocale } from '@libs/i18n';
import { SortOrder } from '../../../common/dto/sort.dto';
import { RecoTrendingSortBy } from './recos-trending.dto';
import { RecosTrendingService } from './recos-trending.service';

describe('RecosTrendingService', () => {
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

  const baseQuery = {
    sort_by: RecoTrendingSortBy.RECOMMENDATION_COUNT,
    sort_order: SortOrder.DESC,
  };

  async function sendRecos(movieId: number, senderId: string, receiverIds: string[]) {
    await testDb.db
      .insert(reco)
      .values(
        receiverIds.map((userId) => ({
          userId,
          senderId,
          type: 'movie' as const,
          movieId,
          status: 'active' as const,
        })),
      );
  }

  describe('refreshTrendingView', () => {
    it('aggregates the recommendation count per media, and does not throw when run again', async () => {
      const { user: sender } = await createTestUser(testDb.db);
      const receivers = await Promise.all([
        createTestUser(testDb.db),
        createTestUser(testDb.db),
        createTestUser(testDb.db),
      ]);
      const movie = await createTestMovie(testDb.db);
      await sendRecos(
        movie.id,
        sender.id,
        receivers.map((r) => r.user.id),
      );
      const service = new RecosTrendingService(testDb.db);

      await service.refreshTrendingView();
      await service.refreshTrendingView();

      const result = await service.listPaginated({
        query: { ...baseQuery, page: 1, per_page: 50 },
        locale: defaultSupportedLocale,
      });
      const entry = result.data.find((d) => d.mediaId === movie.id);
      expect(entry?.recommendationCount).toBe(3);
      expect((entry as { type: string; media: { id: number } }).type).toBe('movie');
      expect((entry as { type: string; media: { id: number } }).media.id).toBe(movie.id);
    });
  });

  describe('listPaginated', () => {
    it('returns an empty list before the view has ever been refreshed', async () => {
      const { user: sender } = await createTestUser(testDb.db);
      const { user: receiver } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      await sendRecos(movie.id, sender.id, [receiver.id]);
      const service = new RecosTrendingService(testDb.db);

      const result = await service.listPaginated({
        query: { ...baseQuery, page: 1, per_page: 10 },
        locale: defaultSupportedLocale,
      });

      expect(result.data).toEqual([]);
    });

    it('sorts by recommendation count', async () => {
      const { user: sender } = await createTestUser(testDb.db);
      const lessRecommended = await createTestMovie(testDb.db);
      const moreRecommended = await createTestTvSeries(testDb.db);
      const [r1, r2, r3] = await Promise.all([
        createTestUser(testDb.db),
        createTestUser(testDb.db),
        createTestUser(testDb.db),
      ]);
      await sendRecos(lessRecommended.id, sender.id, [r1.user.id]);
      await testDb.db.insert(reco).values([
        {
          userId: r1.user.id,
          senderId: sender.id,
          type: 'tv_series',
          tvSeriesId: moreRecommended.id,
          status: 'active',
        },
        {
          userId: r2.user.id,
          senderId: sender.id,
          type: 'tv_series',
          tvSeriesId: moreRecommended.id,
          status: 'active',
        },
        {
          userId: r3.user.id,
          senderId: sender.id,
          type: 'tv_series',
          tvSeriesId: moreRecommended.id,
          status: 'active',
        },
      ]);
      const service = new RecosTrendingService(testDb.db);
      await service.refreshTrendingView();

      const result = await service.listPaginated({
        query: { ...baseQuery, page: 1, per_page: 50 },
        locale: defaultSupportedLocale,
      });

      const moreIndex = result.data.findIndex((d) => d.mediaId === moreRecommended.id);
      const lessIndex = result.data.findIndex((d) => d.mediaId === lessRecommended.id);
      expect(moreIndex).toBeGreaterThanOrEqual(0);
      expect(lessIndex).toBeGreaterThan(moreIndex);
    });

    it('paginates results and reports accurate meta', async () => {
      const { user: sender } = await createTestUser(testDb.db);
      const movies = [];
      for (let i = 0; i < 3; i++) {
        const movie = await createTestMovie(testDb.db);
        const receivers = [];
        for (let j = 0; j <= i; j++) {
          receivers.push((await createTestUser(testDb.db)).user.id);
        }
        await sendRecos(movie.id, sender.id, receivers);
        movies.push(movie);
      }
      const service = new RecosTrendingService(testDb.db);
      await service.refreshTrendingView();

      const page1 = await service.listPaginated({
        query: { ...baseQuery, page: 1, per_page: 2 },
        locale: defaultSupportedLocale,
      });
      // recommendation_count desc: movies[2] (3 recs), movies[1] (2 recs), movies[0] (1 rec).
      expect(page1.data.map((d) => d.mediaId)).toEqual([movies[2].id, movies[1].id]);
      expect(page1.meta).toEqual({
        total_results: 3,
        total_pages: 2,
        current_page: 1,
        per_page: 2,
      });
    });
  });

  describe('listInfinite', () => {
    it('paginates with a cursor until there is no next page', async () => {
      const { user: sender } = await createTestUser(testDb.db);
      const movies = [];
      for (let i = 0; i < 3; i++) {
        const movie = await createTestMovie(testDb.db);
        const receivers = [];
        for (let j = 0; j <= 2 - i; j++) {
          receivers.push((await createTestUser(testDb.db)).user.id);
        }
        await sendRecos(movie.id, sender.id, receivers);
        movies.push(movie);
      }
      const service = new RecosTrendingService(testDb.db);
      await service.refreshTrendingView();

      const firstPage = await service.listInfinite({
        query: { ...baseQuery, per_page: 2 },
        locale: defaultSupportedLocale,
      });
      // recommendation_count desc: movies[0] (3 recs), movies[1] (2 recs), movies[2] (1 rec).
      expect(firstPage.data.map((d) => d.mediaId)).toEqual([movies[0].id, movies[1].id]);
      expect(firstPage.meta.next_cursor).not.toBeNull();

      const secondPage = await service.listInfinite({
        query: { ...baseQuery, per_page: 2, cursor: firstPage.meta.next_cursor ?? undefined },
        locale: defaultSupportedLocale,
      });
      expect(secondPage.data.map((d) => d.mediaId)).toEqual([movies[2].id]);
      expect(secondPage.meta.next_cursor).toBeNull();
    });

    it('includes the total count only on the first page when requested', async () => {
      const { user: sender } = await createTestUser(testDb.db);
      const { user: r1 } = await createTestUser(testDb.db);
      const { user: r2 } = await createTestUser(testDb.db);
      const movieA = await createTestMovie(testDb.db);
      const movieB = await createTestMovie(testDb.db);
      await sendRecos(movieA.id, sender.id, [r1.id]);
      await sendRecos(movieB.id, sender.id, [r2.id]);
      const service = new RecosTrendingService(testDb.db);
      await service.refreshTrendingView();

      const firstPage = await service.listInfinite({
        query: { ...baseQuery, per_page: 1, include_total_count: true },
        locale: defaultSupportedLocale,
      });
      expect(firstPage.meta.total_results).toBe(2);

      const secondPage = await service.listInfinite({
        query: {
          ...baseQuery,
          per_page: 1,
          include_total_count: true,
          cursor: firstPage.meta.next_cursor ?? undefined,
        },
        locale: defaultSupportedLocale,
      });
      expect(secondPage.meta.total_results).toBeUndefined();
    });

    it('rejects a cursor that is not valid base64-encoded JSON', async () => {
      const service = new RecosTrendingService(testDb.db);

      await expect(
        service.listInfinite({
          query: { ...baseQuery, per_page: 10, cursor: 'not-a-valid-cursor' },
          locale: defaultSupportedLocale,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
