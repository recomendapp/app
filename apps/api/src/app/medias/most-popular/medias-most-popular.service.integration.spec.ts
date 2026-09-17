import { BadRequestException } from '@nestjs/common';
import { createTestMovie, createTestTvSeries, TestDatabase } from '@libs/testing';
import { defaultSupportedLocale } from '@libs/i18n';
import { SortOrder } from '../../../common/dto/sort.dto';
import { MediaMostPopularSortBy } from './medias-most-popular.dto';
import { MediasMostPopularService } from './medias-most-popular.service';

describe('MediasMostPopularService', () => {
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

  const baseQuery = { sort_by: MediaMostPopularSortBy.POPULARITY, sort_order: SortOrder.DESC };

  describe('refreshTrendingView', () => {
    it('populates the view from tmdb movies and tv series, and does not throw when run again', async () => {
      const service = new MediasMostPopularService(testDb.db);
      const movie = await createTestMovie(testDb.db, { popularity: 42 });
      const tvSeries = await createTestTvSeries(testDb.db, { popularity: 24 });

      await service.refreshTrendingView();
      await service.refreshTrendingView();

      const result = await service.listPaginated({
        query: { ...baseQuery, page: 1, per_page: 50 },
        locale: defaultSupportedLocale,
      });
      const ids = result.data.map((d) => d.mediaId);
      expect(ids).toContain(movie.id);
      expect(ids).toContain(tvSeries.id);
    });
  });

  describe('listPaginated', () => {
    it('returns an empty list before the view has ever been refreshed', async () => {
      await createTestMovie(testDb.db, { popularity: 99 });
      const service = new MediasMostPopularService(testDb.db);

      const result = await service.listPaginated({
        query: { ...baseQuery, page: 1, per_page: 10 },
        locale: defaultSupportedLocale,
      });

      expect(result.data).toEqual([]);
    });

    it('sorts by popularity descending by default, with movie/tv series media attached', async () => {
      const service = new MediasMostPopularService(testDb.db);
      const lowPopularityMovie = await createTestMovie(testDb.db, { popularity: 10 });
      const highPopularityTvSeries = await createTestTvSeries(testDb.db, { popularity: 90 });
      await service.refreshTrendingView();

      const result = await service.listPaginated({
        query: { ...baseQuery, page: 1, per_page: 50 },
        locale: defaultSupportedLocale,
      });

      const highIndex = result.data.findIndex((d) => d.mediaId === highPopularityTvSeries.id);
      const lowIndex = result.data.findIndex((d) => d.mediaId === lowPopularityMovie.id);
      expect(highIndex).toBeGreaterThanOrEqual(0);
      expect(lowIndex).toBeGreaterThan(highIndex);

      const tvEntry = result.data[highIndex] as { type: string; media: { id: number } };
      expect(tvEntry.type).toBe('tv_series');
      expect(tvEntry.media.id).toBe(highPopularityTvSeries.id);

      const movieEntry = result.data[lowIndex] as { type: string; media: { id: number } };
      expect(movieEntry.type).toBe('movie');
      expect(movieEntry.media.id).toBe(lowPopularityMovie.id);
    });

    it('sorts ascending when requested', async () => {
      const service = new MediasMostPopularService(testDb.db);
      const low = await createTestMovie(testDb.db, { popularity: 1 });
      const high = await createTestMovie(testDb.db, { popularity: 500 });
      await service.refreshTrendingView();

      const result = await service.listPaginated({
        query: {
          sort_by: MediaMostPopularSortBy.POPULARITY,
          sort_order: SortOrder.ASC,
          page: 1,
          per_page: 50,
        },
        locale: defaultSupportedLocale,
      });

      const lowIndex = result.data.findIndex((d) => d.mediaId === low.id);
      const highIndex = result.data.findIndex((d) => d.mediaId === high.id);
      expect(lowIndex).toBeLessThan(highIndex);
    });

    it('paginates results and reports accurate meta', async () => {
      const service = new MediasMostPopularService(testDb.db);
      const items = [];
      for (let i = 0; i < 3; i++) {
        items.push(await createTestMovie(testDb.db, { popularity: 100 - i }));
      }
      await service.refreshTrendingView();

      const page1 = await service.listPaginated({
        query: { ...baseQuery, page: 1, per_page: 2 },
        locale: defaultSupportedLocale,
      });
      expect(page1.data).toHaveLength(2);
      expect(page1.data.map((d) => d.mediaId)).toEqual([items[0].id, items[1].id]);
      expect(page1.meta).toEqual({
        total_results: 3,
        total_pages: 2,
        current_page: 1,
        per_page: 2,
      });

      const page2 = await service.listPaginated({
        query: { ...baseQuery, page: 2, per_page: 2 },
        locale: defaultSupportedLocale,
      });
      expect(page2.data.map((d) => d.mediaId)).toEqual([items[2].id]);
    });
  });

  describe('listInfinite', () => {
    it('paginates with a cursor until there is no next page', async () => {
      const service = new MediasMostPopularService(testDb.db);
      const items = [];
      for (let i = 0; i < 3; i++) {
        items.push(await createTestMovie(testDb.db, { popularity: 100 - i }));
      }
      await service.refreshTrendingView();

      const firstPage = await service.listInfinite({
        query: { ...baseQuery, per_page: 2 },
        locale: defaultSupportedLocale,
      });
      expect(firstPage.data.map((d) => d.mediaId)).toEqual([items[0].id, items[1].id]);
      expect(firstPage.meta.next_cursor).not.toBeNull();

      const secondPage = await service.listInfinite({
        query: { ...baseQuery, per_page: 2, cursor: firstPage.meta.next_cursor ?? undefined },
        locale: defaultSupportedLocale,
      });
      expect(secondPage.data.map((d) => d.mediaId)).toEqual([items[2].id]);
      expect(secondPage.meta.next_cursor).toBeNull();
    });

    it('includes the total count only on the first page when requested', async () => {
      const service = new MediasMostPopularService(testDb.db);
      await createTestMovie(testDb.db, { popularity: 50 });
      await createTestMovie(testDb.db, { popularity: 60 });
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
      const service = new MediasMostPopularService(testDb.db);

      await expect(
        service.listInfinite({
          query: { ...baseQuery, per_page: 10, cursor: 'not-a-valid-cursor' },
          locale: defaultSupportedLocale,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a cursor that decodes to the wrong shape', async () => {
      const service = new MediasMostPopularService(testDb.db);
      const wrongShapeCursor = Buffer.from(JSON.stringify({ foo: 'bar' })).toString('base64');

      await expect(
        service.listInfinite({
          query: { ...baseQuery, per_page: 10, cursor: wrongShapeCursor },
          locale: defaultSupportedLocale,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
