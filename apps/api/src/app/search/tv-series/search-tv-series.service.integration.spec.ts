import { BadRequestException } from '@nestjs/common';
import type { Client as TypesenseClient } from 'typesense';
import { createTestTvSeries, TestDatabase } from '@libs/testing';
import { defaultSupportedLocale } from '@libs/i18n';
import { encodeCursor } from '../../../utils/cursor';
import { SearchTvSeriesService } from './search-tv-series.service';

function fakeTypesense(response: { hits: { document: { id: string } }[]; found: number }) {
  const search = jest.fn().mockResolvedValue(response);
  const documents = jest.fn().mockReturnValue({ search });
  const collections = jest.fn().mockReturnValue({ documents });
  return { client: { collections } as unknown as TypesenseClient, search };
}

describe('SearchTvSeriesService', () => {
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

  describe('hydrateTvSeries', () => {
    it('returns an empty array when given no ids', async () => {
      const service = new SearchTvSeriesService(
        testDb.db,
        fakeTypesense({ hits: [], found: 0 }).client,
      );

      const result = await testDb.db.transaction((tx) => service.hydrateTvSeries(tx, []));

      expect(result).toEqual([]);
    });

    it('preserves the given id order, not database order', async () => {
      const seriesA = await createTestTvSeries(testDb.db);
      const seriesB = await createTestTvSeries(testDb.db);
      const service = new SearchTvSeriesService(
        testDb.db,
        fakeTypesense({ hits: [], found: 0 }).client,
      );

      const result = await testDb.db.transaction((tx) =>
        service.hydrateTvSeries(tx, [String(seriesB.id), String(seriesA.id)]),
      );

      expect(result.map((s) => s.id)).toEqual([seriesB.id, seriesA.id]);
    });

    it('silently drops ids that no longer exist in the database', async () => {
      const series = await createTestTvSeries(testDb.db);
      const service = new SearchTvSeriesService(
        testDb.db,
        fakeTypesense({ hits: [], found: 0 }).client,
      );

      const result = await testDb.db.transaction((tx) =>
        service.hydrateTvSeries(tx, [String(series.id), '999999']),
      );

      expect(result.map((s) => s.id)).toEqual([series.id]);
    });
  });

  describe('listPaginated', () => {
    it('hydrates tv series in typesense hit order and reports accurate meta', async () => {
      const seriesA = await createTestTvSeries(testDb.db);
      const seriesB = await createTestTvSeries(testDb.db);
      const { client } = fakeTypesense({
        hits: [{ document: { id: String(seriesB.id) } }, { document: { id: String(seriesA.id) } }],
        found: 12,
      });
      const service = new SearchTvSeriesService(testDb.db, client);

      const result = await service.listPaginated({
        currentUser: null,
        locale: defaultSupportedLocale,
        dto: { q: 'test', page: 2, per_page: 5 },
      });

      expect(result.data.map((s) => s.id)).toEqual([seriesB.id, seriesA.id]);
      expect(result.meta).toEqual({
        total_results: 12,
        total_pages: 3,
        current_page: 2,
        per_page: 5,
      });
    });

    it('builds typesense filters from genre, season/episode counts and air date bounds', async () => {
      const { client, search } = fakeTypesense({ hits: [], found: 0 });
      const service = new SearchTvSeriesService(testDb.db, client);

      await service.listPaginated({
        currentUser: null,
        locale: defaultSupportedLocale,
        dto: {
          q: 'nolan',
          page: 1,
          per_page: 10,
          genre_ids: '18,10765',
          number_of_seasons_min: 1,
          number_of_seasons_max: 5,
          number_of_episodes_min: 10,
          number_of_episodes_max: 100,
          first_air_date_min: '2020-01-01',
          first_air_date_max: '2020-12-31',
        },
      });

      const minTs = Math.floor(new Date('2020-01-01').getTime() / 1000);
      const maxTs = Math.floor(new Date('2020-12-31').getTime() / 1000);
      expect(search).toHaveBeenCalledWith(
        expect.objectContaining({
          filter_by: `genre_ids:[18,10765] && number_of_seasons:[1..5] && number_of_episodes:[10..100] && first_air_date:[${minTs}..${maxTs}]`,
        }),
      );
    });

    it('omits filter_by entirely when no filters are provided', async () => {
      const { client, search } = fakeTypesense({ hits: [], found: 0 });
      const service = new SearchTvSeriesService(testDb.db, client);

      await service.listPaginated({
        currentUser: null,
        locale: defaultSupportedLocale,
        dto: { q: 'nolan', page: 1, per_page: 10 },
      });

      expect(search).toHaveBeenCalledWith(
        expect.not.objectContaining({ filter_by: expect.anything() }),
      );
    });
  });

  describe('listInfinite', () => {
    it('defaults to page 1 when no cursor is given', async () => {
      const { client, search } = fakeTypesense({ hits: [], found: 0 });
      const service = new SearchTvSeriesService(testDb.db, client);

      await service.listInfinite({
        currentUser: null,
        locale: defaultSupportedLocale,
        dto: { q: 'nolan', per_page: 10 },
      });

      expect(search).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));
    });

    it('decodes the cursor to resume at the right page', async () => {
      const { client, search } = fakeTypesense({ hits: [], found: 0 });
      const service = new SearchTvSeriesService(testDb.db, client);
      const cursor = encodeCursor({ page: 3 });

      await service.listInfinite({
        currentUser: null,
        locale: defaultSupportedLocale,
        dto: { q: 'nolan', per_page: 10, cursor },
      });

      expect(search).toHaveBeenCalledWith(expect.objectContaining({ page: 3 }));
    });

    it('throws BadRequestException for a malformed cursor', async () => {
      const service = new SearchTvSeriesService(
        testDb.db,
        fakeTypesense({ hits: [], found: 0 }).client,
      );

      await expect(
        service.listInfinite({
          currentUser: null,
          locale: defaultSupportedLocale,
          dto: { q: 'nolan', per_page: 10, cursor: 'not-a-valid-cursor!!' },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('returns a next_cursor when more results remain', async () => {
      const { client } = fakeTypesense({ hits: [], found: 25 });
      const service = new SearchTvSeriesService(testDb.db, client);

      const result = await service.listInfinite({
        currentUser: null,
        locale: defaultSupportedLocale,
        dto: { q: 'nolan', per_page: 10 },
      });

      expect(result.meta.next_cursor).not.toBeNull();
    });

    it('returns a null next_cursor once the last page is reached', async () => {
      const { client } = fakeTypesense({ hits: [], found: 10 });
      const service = new SearchTvSeriesService(testDb.db, client);

      const result = await service.listInfinite({
        currentUser: null,
        locale: defaultSupportedLocale,
        dto: { q: 'nolan', per_page: 10 },
      });

      expect(result.meta.next_cursor).toBeNull();
    });

    it('only includes total_results when include_total_count is set', async () => {
      const { client } = fakeTypesense({ hits: [], found: 42 });
      const service = new SearchTvSeriesService(testDb.db, client);

      const withoutCount = await service.listInfinite({
        currentUser: null,
        locale: defaultSupportedLocale,
        dto: { q: 'nolan', per_page: 10 },
      });
      expect(withoutCount.meta.total_results).toBeUndefined();

      const withCount = await service.listInfinite({
        currentUser: null,
        locale: defaultSupportedLocale,
        dto: { q: 'nolan', per_page: 10, include_total_count: true },
      });
      expect(withCount.meta.total_results).toBe(42);
    });
  });
});
