import { BadRequestException } from '@nestjs/common';
import type { Client as TypesenseClient } from 'typesense';
import { createTestUser, TestDatabase } from '@libs/testing';
import { encodeCursor } from '../../../utils/cursor';
import { SearchUsersService } from './search-users.service';

function fakeTypesense(response: { hits: { document: { id: string } }[]; found: number }) {
  const search = jest.fn().mockResolvedValue(response);
  const documents = jest.fn().mockReturnValue({ search });
  const collections = jest.fn().mockReturnValue({ documents });
  return { client: { collections } as unknown as TypesenseClient, search };
}

describe('SearchUsersService', () => {
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

  describe('hydrateUsers', () => {
    it('returns an empty array when given no ids', async () => {
      const service = new SearchUsersService(
        testDb.db,
        fakeTypesense({ hits: [], found: 0 }).client,
      );

      const result = await service.hydrateUsers([]);

      expect(result).toEqual([]);
    });

    it('preserves the given id order, not database order', async () => {
      const { user: userA } = await createTestUser(testDb.db);
      const { user: userB } = await createTestUser(testDb.db);
      const service = new SearchUsersService(
        testDb.db,
        fakeTypesense({ hits: [], found: 0 }).client,
      );

      const result = await service.hydrateUsers([userB.id, userA.id]);

      expect(result.map((u) => u?.id)).toEqual([userB.id, userA.id]);
    });

    it('silently drops ids that no longer exist in the database', async () => {
      const { user } = await createTestUser(testDb.db);
      const service = new SearchUsersService(
        testDb.db,
        fakeTypesense({ hits: [], found: 0 }).client,
      );

      const result = await service.hydrateUsers([user.id, '00000000-0000-0000-0000-000000000000']);

      expect(result.map((u) => u?.id)).toEqual([user.id]);
    });
  });

  describe('listPaginated', () => {
    it('hydrates users in typesense hit order and reports accurate meta', async () => {
      const { user: userA } = await createTestUser(testDb.db);
      const { user: userB } = await createTestUser(testDb.db);
      const { client } = fakeTypesense({
        hits: [{ document: { id: userB.id } }, { document: { id: userA.id } }],
        found: 12,
      });
      const service = new SearchUsersService(testDb.db, client);

      const result = await service.listPaginated({
        currentUser: null,
        dto: { q: 'test', page: 2, per_page: 5 },
      });

      expect(result.data.map((u) => u.id)).toEqual([userB.id, userA.id]);
      expect(result.meta).toEqual({
        total_results: 12,
        total_pages: 3,
        current_page: 2,
        per_page: 5,
      });
    });

    it('searches by username and name, sorted by followers', async () => {
      const { client, search } = fakeTypesense({ hits: [], found: 0 });
      const service = new SearchUsersService(testDb.db, client);

      await service.listPaginated({
        currentUser: null,
        dto: { q: 'nolan', page: 1, per_page: 10 },
      });

      expect(search).toHaveBeenCalledWith(
        expect.objectContaining({
          q: 'nolan',
          query_by: 'username,name',
          sort_by: '_text_match(buckets: 10):desc,followers_count:desc',
        }),
      );
    });
  });

  describe('listInfinite', () => {
    it('defaults to page 1 when no cursor is given', async () => {
      const { client, search } = fakeTypesense({ hits: [], found: 0 });
      const service = new SearchUsersService(testDb.db, client);

      await service.listInfinite({
        currentUser: null,
        dto: { q: 'nolan', per_page: 10 },
      });

      expect(search).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));
    });

    it('decodes the cursor to resume at the right page', async () => {
      const { client, search } = fakeTypesense({ hits: [], found: 0 });
      const service = new SearchUsersService(testDb.db, client);
      const cursor = encodeCursor({ page: 3 });

      await service.listInfinite({
        currentUser: null,
        dto: { q: 'nolan', per_page: 10, cursor },
      });

      expect(search).toHaveBeenCalledWith(expect.objectContaining({ page: 3 }));
    });

    it('throws BadRequestException for a malformed cursor', async () => {
      const service = new SearchUsersService(
        testDb.db,
        fakeTypesense({ hits: [], found: 0 }).client,
      );

      await expect(
        service.listInfinite({
          currentUser: null,
          dto: { q: 'nolan', per_page: 10, cursor: 'not-a-valid-cursor!!' },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('returns a next_cursor when more results remain', async () => {
      const { client } = fakeTypesense({ hits: [], found: 25 });
      const service = new SearchUsersService(testDb.db, client);

      const result = await service.listInfinite({
        currentUser: null,
        dto: { q: 'nolan', per_page: 10 },
      });

      expect(result.meta.next_cursor).not.toBeNull();
    });

    it('returns a null next_cursor once the last page is reached', async () => {
      const { client } = fakeTypesense({ hits: [], found: 10 });
      const service = new SearchUsersService(testDb.db, client);

      const result = await service.listInfinite({
        currentUser: null,
        dto: { q: 'nolan', per_page: 10 },
      });

      expect(result.meta.next_cursor).toBeNull();
    });

    it('only includes total_results when include_total_count is set', async () => {
      const { client } = fakeTypesense({ hits: [], found: 42 });
      const service = new SearchUsersService(testDb.db, client);

      const withoutCount = await service.listInfinite({
        currentUser: null,
        dto: { q: 'nolan', per_page: 10 },
      });
      expect(withoutCount.meta.total_results).toBeUndefined();

      const withCount = await service.listInfinite({
        currentUser: null,
        dto: { q: 'nolan', per_page: 10, include_total_count: true },
      });
      expect(withCount.meta.total_results).toBe(42);
    });
  });
});
