import { eq } from 'drizzle-orm';
import { playlistFeatured, playlistMember } from '@libs/db/schemas';
import { createTestPlaylist, createTestUser, TestDatabase } from '@libs/testing';
import { SortOrder } from '../../../common/dto/sort.dto';
import { PlaylistSortBy } from '../dto/playlists.dto';
import { User } from '../../auth/auth.service';
import { PlaylistFeaturedService } from './playlist-featured.service';

describe('PlaylistFeaturedService', () => {
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
  const service = () => new PlaylistFeaturedService(testDb.db);
  const baseQuery = { sort_by: PlaylistSortBy.CREATED_AT, sort_order: SortOrder.ASC };

  async function feature(playlistId: number) {
    await testDb.db.insert(playlistFeatured).values({ playlistId });
  }

  describe('listPaginated', () => {
    it('excludes playlists that are not featured', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      await createTestPlaylist(testDb.db, { userId: owner.id }, { visibility: 'public' });

      const result = await service().listPaginated({
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: null,
      });

      expect(result.data).toEqual([]);
    });

    it('includes a featured public playlist for anonymous viewers', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id }, { visibility: 'public' });
      await feature(p.id);

      const result = await service().listPaginated({
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: null,
      });

      expect(result.data.map((r) => r.id)).toEqual([p.id]);
    });

    it('hides a featured private playlist from an anonymous viewer', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(
        testDb.db,
        { userId: owner.id },
        { visibility: 'private' },
      );
      await feature(p.id);

      const result = await service().listPaginated({
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: null,
      });

      expect(result.data).toEqual([]);
    });

    it('shows a featured private playlist to a member', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: member } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(
        testDb.db,
        { userId: owner.id },
        { visibility: 'private' },
      );
      await feature(p.id);
      await testDb.db
        .insert(playlistMember)
        .values({ playlistId: p.id, userId: member.id, role: 'viewer' });

      const result = await service().listPaginated({
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: asUser(member),
      });

      expect(result.data.map((r) => r.id)).toEqual([p.id]);
      expect(result.data[0].role).toBe('viewer');
    });

    it('stops listing a playlist once it is unfeatured', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id }, { visibility: 'public' });
      await feature(p.id);
      await testDb.db.delete(playlistFeatured).where(eq(playlistFeatured.playlistId, p.id));

      const result = await service().listPaginated({
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: null,
      });

      expect(result.data).toEqual([]);
    });

    it('paginates results and reports accurate meta', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      for (let i = 0; i < 3; i++) {
        const p = await createTestPlaylist(
          testDb.db,
          { userId: owner.id },
          { visibility: 'public' },
        );
        await feature(p.id);
      }

      const page1 = await service().listPaginated({
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
    it('paginates with a cursor until there is no next page', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const playlists = [];
      for (let i = 0; i < 3; i++) {
        const p = await createTestPlaylist(
          testDb.db,
          { userId: owner.id },
          { visibility: 'public' },
        );
        await feature(p.id);
        playlists.push(p);
      }

      const firstPage = await service().listInfinite({
        query: { ...baseQuery, per_page: 2 },
        currentUser: null,
      });
      expect(firstPage.data).toHaveLength(2);
      expect(firstPage.meta.next_cursor).not.toBeNull();

      const secondPage = await service().listInfinite({
        query: { ...baseQuery, per_page: 2, cursor: firstPage.meta.next_cursor ?? undefined },
        currentUser: null,
      });
      expect(secondPage.data).toHaveLength(1);
      expect(secondPage.meta.next_cursor).toBeNull();
    });
  });
});
