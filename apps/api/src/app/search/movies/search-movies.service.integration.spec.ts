import { BadRequestException } from '@nestjs/common';
import type { Client as TypesenseClient } from 'typesense';
import { createTestMovie, TestDatabase } from '@libs/testing';
import { defaultSupportedLocale } from '@libs/i18n';
import { encodeCursor } from '../../../utils/cursor';
import { SearchMoviesService } from './search-movies.service';

function fakeTypesense(response: { hits: { document: { id: string } }[]; found: number }) {
  const search = jest.fn().mockResolvedValue(response);
  const documents = jest.fn().mockReturnValue({ search });
  const collections = jest.fn().mockReturnValue({ documents });
  return { client: { collections } as unknown as TypesenseClient, search };
}

describe('SearchMoviesService', () => {
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

  describe('hydrateMovies', () => {
    it('returns an empty array when given no ids', async () => {
      const service = new SearchMoviesService(
        testDb.db,
        fakeTypesense({ hits: [], found: 0 }).client,
      );

      const result = await testDb.db.transaction((tx) => service.hydrateMovies(tx, []));

      expect(result).toEqual([]);
    });

    it('preserves the given id order, not database order', async () => {
      const movieA = await createTestMovie(testDb.db);
      const movieB = await createTestMovie(testDb.db);
      const service = new SearchMoviesService(
        testDb.db,
        fakeTypesense({ hits: [], found: 0 }).client,
      );

      const result = await testDb.db.transaction((tx) =>
        service.hydrateMovies(tx, [String(movieB.id), String(movieA.id)]),
      );

      expect(result.map((m) => m.id)).toEqual([movieB.id, movieA.id]);
    });

    it('silently drops ids that no longer exist in the database', async () => {
      const movie = await createTestMovie(testDb.db);
      const service = new SearchMoviesService(
        testDb.db,
        fakeTypesense({ hits: [], found: 0 }).client,
      );

      const result = await testDb.db.transaction((tx) =>
        service.hydrateMovies(tx, [String(movie.id), '999999']),
      );

      expect(result.map((m) => m.id)).toEqual([movie.id]);
    });
  });

  describe('listPaginated', () => {
    it('hydrates movies in typesense hit order and reports accurate meta', async () => {
      const movieA = await createTestMovie(testDb.db);
      const movieB = await createTestMovie(testDb.db);
      const { client } = fakeTypesense({
        hits: [{ document: { id: String(movieB.id) } }, { document: { id: String(movieA.id) } }],
        found: 12,
      });
      const service = new SearchMoviesService(testDb.db, client);

      const result = await service.listPaginated({
        currentUser: null,
        locale: defaultSupportedLocale,
        dto: { q: 'test', page: 2, per_page: 5 },
      });

      expect(result.data.map((m) => m.id)).toEqual([movieB.id, movieA.id]);
      expect(result.meta).toEqual({
        total_results: 12,
        total_pages: 3,
        current_page: 2,
        per_page: 5,
      });
    });

    it('builds typesense filters from genre, runtime and release date bounds', async () => {
      const { client, search } = fakeTypesense({ hits: [], found: 0 });
      const service = new SearchMoviesService(testDb.db, client);

      await service.listPaginated({
        currentUser: null,
        locale: defaultSupportedLocale,
        dto: {
          q: 'nolan',
          page: 1,
          per_page: 10,
          genre_ids: '28,12',
          runtime_min: 90,
          runtime_max: 180,
          release_date_min: '2020-01-01',
          release_date_max: '2020-12-31',
        },
      });

      const minTs = Math.floor(new Date('2020-01-01').getTime() / 1000);
      const maxTs = Math.floor(new Date('2020-12-31').getTime() / 1000);
      expect(search).toHaveBeenCalledWith(
        expect.objectContaining({
          filter_by: `genre_ids:[28,12] && runtime:[90..180] && release_date:[${minTs}..${maxTs}]`,
        }),
      );
    });

    it('omits filter_by entirely when no filters are provided', async () => {
      const { client, search } = fakeTypesense({ hits: [], found: 0 });
      const service = new SearchMoviesService(testDb.db, client);

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
      const service = new SearchMoviesService(testDb.db, client);

      await service.listInfinite({
        currentUser: null,
        locale: defaultSupportedLocale,
        dto: { q: 'nolan', per_page: 10 },
      });

      expect(search).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));
    });

    it('decodes the cursor to resume at the right page', async () => {
      const { client, search } = fakeTypesense({ hits: [], found: 0 });
      const service = new SearchMoviesService(testDb.db, client);
      const cursor = encodeCursor({ page: 3 });

      await service.listInfinite({
        currentUser: null,
        locale: defaultSupportedLocale,
        dto: { q: 'nolan', per_page: 10, cursor },
      });

      expect(search).toHaveBeenCalledWith(expect.objectContaining({ page: 3 }));
    });

    it('throws BadRequestException for a malformed cursor', async () => {
      const service = new SearchMoviesService(
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
      const service = new SearchMoviesService(testDb.db, client);

      const result = await service.listInfinite({
        currentUser: null,
        locale: defaultSupportedLocale,
        dto: { q: 'nolan', per_page: 10 },
      });

      expect(result.meta.next_cursor).not.toBeNull();
    });

    it('returns a null next_cursor once the last page is reached', async () => {
      const { client } = fakeTypesense({ hits: [], found: 10 });
      const service = new SearchMoviesService(testDb.db, client);

      const result = await service.listInfinite({
        currentUser: null,
        locale: defaultSupportedLocale,
        dto: { q: 'nolan', per_page: 10 },
      });

      expect(result.meta.next_cursor).toBeNull();
    });

    it('only includes total_results when include_total_count is set', async () => {
      const { client } = fakeTypesense({ hits: [], found: 42 });
      const service = new SearchMoviesService(testDb.db, client);

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
