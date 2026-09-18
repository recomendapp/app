import { BadRequestException } from '@nestjs/common';
import type { Client as TypesenseClient } from 'typesense';
import { follow, playlistMember, profile } from '@libs/db/schemas';
import { createTestPlaylist, createTestUser, TestDatabase } from '@libs/testing';
import { eq } from 'drizzle-orm';
import { encodeCursor } from '../../../utils/cursor';
import { User } from '../../auth/auth.service';
import { SearchPlaylistsService } from './search-playlists.service';

function fakeTypesense(response: { hits: { document: { id: string } }[]; found: number }) {
  const search = jest.fn().mockResolvedValue(response);
  const documents = jest.fn().mockReturnValue({ search });
  const collections = jest.fn().mockReturnValue({ documents });
  return { client: { collections } as unknown as TypesenseClient, search };
}

describe('SearchPlaylistsService', () => {
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

  describe('buildFilterBy', () => {
    it('only allows public playlists for an anonymous user', async () => {
      const service = new SearchPlaylistsService(
        testDb.db,
        fakeTypesense({ hits: [], found: 0 }).client,
      );

      const result = await service.buildFilterBy(null);

      expect(result).toBe('visibility:=public');
    });

    it('includes owned and member playlists for an authenticated user with no follows', async () => {
      const { user } = await createTestUser(testDb.db);
      const service = new SearchPlaylistsService(
        testDb.db,
        fakeTypesense({ hits: [], found: 0 }).client,
      );

      const result = await service.buildFilterBy(asUser(user));

      expect(result).toBe(`visibility:=public || owner_id:=${user.id} || member_ids:=${user.id}`);
    });

    it('includes a followers-only clause scoped to accepted follows', async () => {
      const { user } = await createTestUser(testDb.db);
      const { user: followed } = await createTestUser(testDb.db);
      const { user: pendingFollow } = await createTestUser(testDb.db);
      await testDb.db
        .insert(follow)
        .values({ followerId: user.id, followingId: followed.id, status: 'accepted' });
      await testDb.db
        .insert(follow)
        .values({ followerId: user.id, followingId: pendingFollow.id, status: 'pending' });
      const service = new SearchPlaylistsService(
        testDb.db,
        fakeTypesense({ hits: [], found: 0 }).client,
      );

      const result = await service.buildFilterBy(asUser(user));

      expect(result).toBe(
        `visibility:=public || owner_id:=${user.id} || member_ids:=${user.id} || (visibility:=followers && owner_id:=[${followed.id}])`,
      );
    });
  });

  describe('hydratePlaylists', () => {
    it('returns an empty array when given no ids', async () => {
      const service = new SearchPlaylistsService(
        testDb.db,
        fakeTypesense({ hits: [], found: 0 }).client,
      );

      const result = await service.hydratePlaylists([], null);

      expect(result).toEqual([]);
    });

    it('preserves the given id order and drops ids that no longer exist', async () => {
      const { user } = await createTestUser(testDb.db);
      const playlistA = await createTestPlaylist(testDb.db, { userId: user.id });
      const playlistB = await createTestPlaylist(testDb.db, { userId: user.id });
      const service = new SearchPlaylistsService(
        testDb.db,
        fakeTypesense({ hits: [], found: 0 }).client,
      );

      const result = await service.hydratePlaylists(
        [String(playlistB.id), '999999', String(playlistA.id)],
        null,
      );

      expect(result.map((r) => r?.playlist.id)).toEqual([playlistB.id, playlistA.id]);
    });

    it('reports role null for an anonymous viewer', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });
      const service = new SearchPlaylistsService(
        testDb.db,
        fakeTypesense({ hits: [], found: 0 }).client,
      );

      const [result] = await service.hydratePlaylists([String(p.id)], null);

      expect(result?.role).toBeNull();
    });

    it('reports role owner for the playlist owner', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });
      const service = new SearchPlaylistsService(
        testDb.db,
        fakeTypesense({ hits: [], found: 0 }).client,
      );

      const [result] = await service.hydratePlaylists([String(p.id)], asUser(owner));

      expect(result?.role).toBe('owner');
    });

    it('reports role null for a non-member, non-owner viewer', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: other } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });
      const service = new SearchPlaylistsService(
        testDb.db,
        fakeTypesense({ hits: [], found: 0 }).client,
      );

      const [result] = await service.hydratePlaylists([String(p.id)], asUser(other));

      expect(result?.role).toBeNull();
    });

    it("downgrades a member's role to viewer when the owner is not premium", async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: member } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });
      await testDb.db
        .insert(playlistMember)
        .values({ playlistId: p.id, userId: member.id, role: 'admin' });
      const service = new SearchPlaylistsService(
        testDb.db,
        fakeTypesense({ hits: [], found: 0 }).client,
      );

      const [result] = await service.hydratePlaylists([String(p.id)], asUser(member));

      expect(result?.role).toBe('viewer');
    });

    it("reports the member's actual role when the owner is premium", async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: member } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });
      await testDb.db.update(profile).set({ isPremium: true }).where(eq(profile.id, owner.id));
      await testDb.db
        .insert(playlistMember)
        .values({ playlistId: p.id, userId: member.id, role: 'editor' });
      const service = new SearchPlaylistsService(
        testDb.db,
        fakeTypesense({ hits: [], found: 0 }).client,
      );

      const [result] = await service.hydratePlaylists([String(p.id)], asUser(member));

      expect(result?.role).toBe('editor');
    });
  });

  describe('listPaginated', () => {
    it('hydrates playlists in typesense hit order, attaching role and owner', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const playlistA = await createTestPlaylist(testDb.db, { userId: owner.id });
      const playlistB = await createTestPlaylist(testDb.db, { userId: owner.id });
      const { client } = fakeTypesense({
        hits: [
          { document: { id: String(playlistB.id) } },
          { document: { id: String(playlistA.id) } },
        ],
        found: 12,
      });
      const service = new SearchPlaylistsService(testDb.db, client);

      const result = await service.listPaginated({
        currentUser: asUser(owner),
        dto: { q: 'test', page: 2, per_page: 5 },
      });

      expect(result.data.map((p) => p.id)).toEqual([playlistB.id, playlistA.id]);
      expect(result.data[0].role).toBe('owner');
      expect(result.data[0].owner.id).toBe(owner.id);
      expect(result.meta).toEqual({
        total_results: 12,
        total_pages: 3,
        current_page: 2,
        per_page: 5,
      });
    });

    it('scopes the typesense filter to what buildFilterBy computes', async () => {
      const { user } = await createTestUser(testDb.db);
      const { client, search } = fakeTypesense({ hits: [], found: 0 });
      const service = new SearchPlaylistsService(testDb.db, client);

      await service.listPaginated({
        currentUser: asUser(user),
        dto: { q: 'test', page: 1, per_page: 10 },
      });

      expect(search).toHaveBeenCalledWith(
        expect.objectContaining({
          filter_by: `visibility:=public || owner_id:=${user.id} || member_ids:=${user.id}`,
        }),
      );
    });
  });

  describe('listInfinite', () => {
    it('defaults to page 1 when no cursor is given', async () => {
      const { client, search } = fakeTypesense({ hits: [], found: 0 });
      const service = new SearchPlaylistsService(testDb.db, client);

      await service.listInfinite({ currentUser: null, dto: { q: 'nolan', per_page: 10 } });

      expect(search).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));
    });

    it('decodes the cursor to resume at the right page', async () => {
      const { client, search } = fakeTypesense({ hits: [], found: 0 });
      const service = new SearchPlaylistsService(testDb.db, client);
      const cursor = encodeCursor({ page: 3 });

      await service.listInfinite({ currentUser: null, dto: { q: 'nolan', per_page: 10, cursor } });

      expect(search).toHaveBeenCalledWith(expect.objectContaining({ page: 3 }));
    });

    it('throws BadRequestException for a malformed cursor', async () => {
      const service = new SearchPlaylistsService(
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
      const service = new SearchPlaylistsService(testDb.db, client);

      const result = await service.listInfinite({
        currentUser: null,
        dto: { q: 'nolan', per_page: 10 },
      });

      expect(result.meta.next_cursor).not.toBeNull();
    });

    it('returns a null next_cursor once the last page is reached', async () => {
      const { client } = fakeTypesense({ hits: [], found: 10 });
      const service = new SearchPlaylistsService(testDb.db, client);

      const result = await service.listInfinite({
        currentUser: null,
        dto: { q: 'nolan', per_page: 10 },
      });

      expect(result.meta.next_cursor).toBeNull();
    });

    it('only includes total_results when include_total_count is set', async () => {
      const { client } = fakeTypesense({ hits: [], found: 42 });
      const service = new SearchPlaylistsService(testDb.db, client);

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
