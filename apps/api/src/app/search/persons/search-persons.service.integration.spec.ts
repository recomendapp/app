import { BadRequestException } from '@nestjs/common';
import type { Client as TypesenseClient } from 'typesense';
import { createTestPerson, TestDatabase } from '@libs/testing';
import { defaultSupportedLocale } from '@libs/i18n';
import { encodeCursor } from '../../../utils/cursor';
import { SearchPersonsService } from './search-persons.service';

function fakeTypesense(response: { hits: { document: { id: string } }[]; found: number }) {
  const search = jest.fn().mockResolvedValue(response);
  const documents = jest.fn().mockReturnValue({ search });
  const collections = jest.fn().mockReturnValue({ documents });
  return { client: { collections } as unknown as TypesenseClient, search };
}

describe('SearchPersonsService', () => {
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

  describe('hydratePersons', () => {
    it('returns an empty array when given no ids', async () => {
      const service = new SearchPersonsService(
        testDb.db,
        fakeTypesense({ hits: [], found: 0 }).client,
      );

      const result = await testDb.db.transaction((tx) => service.hydratePersons(tx, []));

      expect(result).toEqual([]);
    });

    it('preserves the given id order, not database order', async () => {
      const personA = await createTestPerson(testDb.db);
      const personB = await createTestPerson(testDb.db);
      const service = new SearchPersonsService(
        testDb.db,
        fakeTypesense({ hits: [], found: 0 }).client,
      );

      const result = await testDb.db.transaction((tx) =>
        service.hydratePersons(tx, [String(personB.id), String(personA.id)]),
      );

      expect(result.map((p) => p.id)).toEqual([personB.id, personA.id]);
    });

    it('silently drops ids that no longer exist in the database', async () => {
      const person = await createTestPerson(testDb.db);
      const service = new SearchPersonsService(
        testDb.db,
        fakeTypesense({ hits: [], found: 0 }).client,
      );

      const result = await testDb.db.transaction((tx) =>
        service.hydratePersons(tx, [String(person.id), '999999']),
      );

      expect(result.map((p) => p.id)).toEqual([person.id]);
    });
  });

  describe('listPaginated', () => {
    it('hydrates persons in typesense hit order and reports accurate meta', async () => {
      const personA = await createTestPerson(testDb.db);
      const personB = await createTestPerson(testDb.db);
      const { client } = fakeTypesense({
        hits: [{ document: { id: String(personB.id) } }, { document: { id: String(personA.id) } }],
        found: 12,
      });
      const service = new SearchPersonsService(testDb.db, client);

      const result = await service.listPaginated({
        currentUser: null,
        locale: defaultSupportedLocale,
        dto: { q: 'nolan', page: 2, per_page: 5 },
      });

      expect(result.data.map((p) => p.id)).toEqual([personB.id, personA.id]);
      expect(result.meta).toEqual({
        total_results: 12,
        total_pages: 3,
        current_page: 2,
        per_page: 5,
      });
    });
  });

  describe('listInfinite', () => {
    it('defaults to page 1 when no cursor is given', async () => {
      const { client, search } = fakeTypesense({ hits: [], found: 0 });
      const service = new SearchPersonsService(testDb.db, client);

      await service.listInfinite({
        currentUser: null,
        locale: defaultSupportedLocale,
        dto: { q: 'nolan', per_page: 10 },
      });

      expect(search).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));
    });

    it('decodes the cursor to resume at the right page', async () => {
      const { client, search } = fakeTypesense({ hits: [], found: 0 });
      const service = new SearchPersonsService(testDb.db, client);
      const cursor = encodeCursor({ page: 3 });

      await service.listInfinite({
        currentUser: null,
        locale: defaultSupportedLocale,
        dto: { q: 'nolan', per_page: 10, cursor },
      });

      expect(search).toHaveBeenCalledWith(expect.objectContaining({ page: 3 }));
    });

    it('throws BadRequestException for a malformed cursor', async () => {
      const service = new SearchPersonsService(
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
      const service = new SearchPersonsService(testDb.db, client);

      const result = await service.listInfinite({
        currentUser: null,
        locale: defaultSupportedLocale,
        dto: { q: 'nolan', per_page: 10 },
      });

      expect(result.meta.next_cursor).not.toBeNull();
    });

    it('returns a null next_cursor once the last page is reached', async () => {
      const { client } = fakeTypesense({ hits: [], found: 10 });
      const service = new SearchPersonsService(testDb.db, client);

      const result = await service.listInfinite({
        currentUser: null,
        locale: defaultSupportedLocale,
        dto: { q: 'nolan', per_page: 10 },
      });

      expect(result.meta.next_cursor).toBeNull();
    });

    it('only includes total_results when include_total_count is set', async () => {
      const { client } = fakeTypesense({ hits: [], found: 42 });
      const service = new SearchPersonsService(testDb.db, client);

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
