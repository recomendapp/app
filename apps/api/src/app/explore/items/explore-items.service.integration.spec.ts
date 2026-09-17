import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  createTestExplore,
  createTestExploreItem,
  createTestMovie,
  createTestTvSeries,
  TestDatabase,
} from '@libs/testing';
import { defaultSupportedLocale } from '@libs/i18n';
import { SortOrder } from '../../../common/dto/sort.dto';
import { ExploreService } from '../explore.service';
import { ExploreItemsService } from './explore-items.service';

describe('ExploreItemsService', () => {
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

  function buildService() {
    const exploreService = new ExploreService(testDb.db);
    return new ExploreItemsService(testDb.db, exploreService);
  }

  const baseQuery = { sort_order: SortOrder.ASC };

  describe('listAll', () => {
    it('throws when the explore map does not exist', async () => {
      const service = buildService();

      await expect(
        service.listAll({ identifier: 'nope', query: baseQuery, locale: defaultSupportedLocale }),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns an empty array for an explore map with no items', async () => {
      const explore = await createTestExplore(testDb.db);
      const service = buildService();

      const result = await service.listAll({
        identifier: String(explore.id),
        query: baseQuery,
        locale: defaultSupportedLocale,
      });

      expect(result).toEqual([]);
    });

    it('returns items with their attached media and mapped location', async () => {
      const explore = await createTestExplore(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const item = await createTestExploreItem(testDb.db, {
        exploreId: explore.id,
        movieId: movie.id,
        lat: 48.8566,
        lng: 2.3522,
      });
      const service = buildService();

      const result = await service.listAll({
        identifier: String(explore.id),
        query: baseQuery,
        locale: defaultSupportedLocale,
      });

      expect(result).toHaveLength(1);
      const [entry] = result;
      expect(entry.id).toBe(item.id);
      expect(entry.type).toBe('movie');
      expect(entry.mediaId).toBe(movie.id);
      expect(entry.media.id).toBe(movie.id);
      expect(entry.location.lat).toBeCloseTo(48.8566, 4);
      expect(entry.location.lng).toBeCloseTo(2.3522, 4);
    });

    it('resolves the explore map by slug too', async () => {
      const explore = await createTestExplore(testDb.db, { slug: 'rome-tour' });
      const movie = await createTestMovie(testDb.db);
      await createTestExploreItem(testDb.db, { exploreId: explore.id, movieId: movie.id });
      const service = buildService();

      const result = await service.listAll({
        identifier: 'rome-tour',
        query: baseQuery,
        locale: defaultSupportedLocale,
      });

      expect(result).toHaveLength(1);
    });

    it('filters by type', async () => {
      const explore = await createTestExplore(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const tvSeries = await createTestTvSeries(testDb.db);
      await createTestExploreItem(testDb.db, { exploreId: explore.id, movieId: movie.id });
      await createTestExploreItem(testDb.db, { exploreId: explore.id, tvSeriesId: tvSeries.id });
      const service = buildService();

      const movieOnly = await service.listAll({
        identifier: String(explore.id),
        query: { ...baseQuery, type: 'movie' },
        locale: defaultSupportedLocale,
      });
      expect(movieOnly).toHaveLength(1);
      expect(movieOnly[0].type).toBe('movie');

      const tvOnly = await service.listAll({
        identifier: String(explore.id),
        query: { ...baseQuery, type: 'tv_series' },
        locale: defaultSupportedLocale,
      });
      expect(tvOnly).toHaveLength(1);
      expect(tvOnly[0].type).toBe('tv_series');
    });

    it('sorts by item id ascending and descending', async () => {
      const explore = await createTestExplore(testDb.db);
      const movieA = await createTestMovie(testDb.db);
      const movieB = await createTestMovie(testDb.db);
      const first = await createTestExploreItem(testDb.db, {
        exploreId: explore.id,
        movieId: movieA.id,
      });
      const second = await createTestExploreItem(testDb.db, {
        exploreId: explore.id,
        movieId: movieB.id,
      });
      const service = buildService();

      const asc = await service.listAll({
        identifier: String(explore.id),
        query: { sort_order: SortOrder.ASC },
        locale: defaultSupportedLocale,
      });
      expect(asc.map((i) => i.id)).toEqual([first.id, second.id]);

      const desc = await service.listAll({
        identifier: String(explore.id),
        query: { sort_order: SortOrder.DESC },
        locale: defaultSupportedLocale,
      });
      expect(desc.map((i) => i.id)).toEqual([second.id, first.id]);
    });

    it('does not leak items belonging to another explore map', async () => {
      const exploreA = await createTestExplore(testDb.db);
      const exploreB = await createTestExplore(testDb.db);
      const movieA = await createTestMovie(testDb.db);
      const movieB = await createTestMovie(testDb.db);
      const itemA = await createTestExploreItem(testDb.db, {
        exploreId: exploreA.id,
        movieId: movieA.id,
      });
      await createTestExploreItem(testDb.db, { exploreId: exploreB.id, movieId: movieB.id });
      const service = buildService();

      const result = await service.listAll({
        identifier: String(exploreA.id),
        query: baseQuery,
        locale: defaultSupportedLocale,
      });

      expect(result.map((i) => i.id)).toEqual([itemA.id]);
    });
  });

  describe('listPaginated', () => {
    it('paginates results and reports accurate meta', async () => {
      const explore = await createTestExplore(testDb.db);
      const items = [];
      for (let i = 0; i < 3; i++) {
        const movie = await createTestMovie(testDb.db);
        items.push(
          await createTestExploreItem(testDb.db, { exploreId: explore.id, movieId: movie.id }),
        );
      }
      const service = buildService();

      const page1 = await service.listPaginated({
        identifier: String(explore.id),
        query: { ...baseQuery, page: 1, per_page: 2 },
        locale: defaultSupportedLocale,
      });
      expect(page1.data.map((i) => i.id)).toEqual([items[0].id, items[1].id]);
      expect(page1.meta).toEqual({
        total_results: 3,
        total_pages: 2,
        current_page: 1,
        per_page: 2,
      });

      const page2 = await service.listPaginated({
        identifier: String(explore.id),
        query: { ...baseQuery, page: 2, per_page: 2 },
        locale: defaultSupportedLocale,
      });
      expect(page2.data.map((i) => i.id)).toEqual([items[2].id]);
      expect(page2.meta.current_page).toBe(2);
    });

    it('combines pagination with a type filter', async () => {
      const explore = await createTestExplore(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const tvSeries = await createTestTvSeries(testDb.db);
      await createTestExploreItem(testDb.db, { exploreId: explore.id, movieId: movie.id });
      await createTestExploreItem(testDb.db, { exploreId: explore.id, tvSeriesId: tvSeries.id });
      const service = buildService();

      const result = await service.listPaginated({
        identifier: String(explore.id),
        query: { ...baseQuery, page: 1, per_page: 10, type: 'tv_series' },
        locale: defaultSupportedLocale,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].type).toBe('tv_series');
      expect(result.meta.total_results).toBe(1);
    });

    it('throws when the explore map does not exist', async () => {
      const service = buildService();

      await expect(
        service.listPaginated({
          identifier: 'nope',
          query: { ...baseQuery, page: 1, per_page: 10 },
          locale: defaultSupportedLocale,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('listInfinite', () => {
    it('paginates with a cursor until there is no next page', async () => {
      const explore = await createTestExplore(testDb.db);
      const items = [];
      for (let i = 0; i < 3; i++) {
        const movie = await createTestMovie(testDb.db);
        items.push(
          await createTestExploreItem(testDb.db, { exploreId: explore.id, movieId: movie.id }),
        );
      }
      const service = buildService();

      const firstPage = await service.listInfinite({
        identifier: String(explore.id),
        query: { ...baseQuery, per_page: 2 },
        locale: defaultSupportedLocale,
      });
      expect(firstPage.data.map((i) => i.id)).toEqual([items[0].id, items[1].id]);
      expect(firstPage.meta.next_cursor).not.toBeNull();

      const secondPage = await service.listInfinite({
        identifier: String(explore.id),
        query: { ...baseQuery, per_page: 2, cursor: firstPage.meta.next_cursor ?? undefined },
        locale: defaultSupportedLocale,
      });
      expect(secondPage.data.map((i) => i.id)).toEqual([items[2].id]);
      expect(secondPage.meta.next_cursor).toBeNull();
    });

    it('only includes the total count on the first page when requested', async () => {
      const explore = await createTestExplore(testDb.db);
      const items = [];
      for (let i = 0; i < 2; i++) {
        const movie = await createTestMovie(testDb.db);
        items.push(
          await createTestExploreItem(testDb.db, { exploreId: explore.id, movieId: movie.id }),
        );
      }
      const service = buildService();

      const firstPage = await service.listInfinite({
        identifier: String(explore.id),
        query: { ...baseQuery, per_page: 1, include_total_count: true },
        locale: defaultSupportedLocale,
      });
      expect(firstPage.meta.total_results).toBe(2);

      const secondPage = await service.listInfinite({
        identifier: String(explore.id),
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

    it('omits the total count when it was not requested', async () => {
      const explore = await createTestExplore(testDb.db);
      const movie = await createTestMovie(testDb.db);
      await createTestExploreItem(testDb.db, { exploreId: explore.id, movieId: movie.id });
      const service = buildService();

      const result = await service.listInfinite({
        identifier: String(explore.id),
        query: { ...baseQuery, per_page: 10 },
        locale: defaultSupportedLocale,
      });

      expect(result.meta.total_results).toBeUndefined();
    });

    it('rejects a cursor that is not valid base64-encoded JSON', async () => {
      const explore = await createTestExplore(testDb.db);
      const service = buildService();

      await expect(
        service.listInfinite({
          identifier: String(explore.id),
          query: { ...baseQuery, per_page: 10, cursor: 'not-a-valid-cursor' },
          locale: defaultSupportedLocale,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a cursor that decodes to the wrong shape', async () => {
      const explore = await createTestExplore(testDb.db);
      const wrongShapeCursor = Buffer.from(JSON.stringify({ foo: 'bar' })).toString('base64');
      const service = buildService();

      await expect(
        service.listInfinite({
          identifier: String(explore.id),
          query: { ...baseQuery, per_page: 10, cursor: wrongShapeCursor },
          locale: defaultSupportedLocale,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when the explore map does not exist', async () => {
      const service = buildService();

      await expect(
        service.listInfinite({
          identifier: 'nope',
          query: { ...baseQuery, per_page: 10 },
          locale: defaultSupportedLocale,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
