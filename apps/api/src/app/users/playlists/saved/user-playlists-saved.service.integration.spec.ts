import { eq } from 'drizzle-orm';
import { playlistSaved } from '@libs/db/schemas';
import { createTestPlaylist, createTestUser, TestDatabase } from '@libs/testing';
import { User } from '../../../auth/auth.service';
import { PlaylistSavedSortBy } from '../../../playlists/saves/dto/playlist-saved.dto';
import { SortOrder } from '../../../../common/dto/sort.dto';
import { UserPlaylistsSavedService } from './user-playlists-saved.service';

describe('UserPlaylistsSavedService', () => {
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
  const service = () => new UserPlaylistsSavedService(testDb.db);
  const baseQuery = { sort_by: PlaylistSavedSortBy.SAVED_AT, sort_order: SortOrder.DESC };

  async function save(playlistId: number, userId: string) {
    await testDb.db.insert(playlistSaved).values({ playlistId, userId });
  }

  describe('visibility', () => {
    it('shows a saved public playlist to anyone', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: saver } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id }, { visibility: 'public' });
      await save(p.id, saver.id);

      const result = await service().listPaginated({
        targetUserId: saver.id,
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: null,
      });

      expect(result.data.map((r) => r.id)).toEqual([p.id]);
    });

    it('hides a saved playlist that has since turned private from viewers other than its owner', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: saver } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(
        testDb.db,
        { userId: owner.id },
        { visibility: 'private' },
      );
      await save(p.id, saver.id);

      const result = await service().listPaginated({
        targetUserId: saver.id,
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: null,
      });

      expect(result.data).toEqual([]);
    });

    it('still shows a saved private playlist to its own owner viewing someone else saved list', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: saver } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(
        testDb.db,
        { userId: owner.id },
        { visibility: 'private' },
      );
      await save(p.id, saver.id);

      const result = await service().listPaginated({
        targetUserId: saver.id,
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: asUser(owner),
      });

      expect(result.data.map((r) => r.id)).toEqual([p.id]);
    });
  });

  describe('listing correctness', () => {
    it('does not leak another user saved playlists', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: saverA } = await createTestUser(testDb.db);
      const { user: saverB } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id }, { visibility: 'public' });
      await save(p.id, saverA.id);

      const result = await service().listPaginated({
        targetUserId: saverB.id,
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: null,
      });

      expect(result.data).toEqual([]);
    });

    it('stops listing a playlist once it has been unsaved', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: saver } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id }, { visibility: 'public' });
      await save(p.id, saver.id);
      await testDb.db.delete(playlistSaved).where(eq(playlistSaved.playlistId, p.id));

      const result = await service().listPaginated({
        targetUserId: saver.id,
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: null,
      });

      expect(result.data).toEqual([]);
    });

    it('paginates results and reports accurate meta', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: saver } = await createTestUser(testDb.db);
      for (let i = 0; i < 3; i++) {
        const p = await createTestPlaylist(
          testDb.db,
          { userId: owner.id },
          { visibility: 'public' },
        );
        await save(p.id, saver.id);
      }

      const page1 = await service().listPaginated({
        targetUserId: saver.id,
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
      const { user: saver } = await createTestUser(testDb.db);
      for (let i = 0; i < 3; i++) {
        const p = await createTestPlaylist(
          testDb.db,
          { userId: owner.id },
          { visibility: 'public' },
        );
        await save(p.id, saver.id);
      }

      const firstPage = await service().listInfinite({
        targetUserId: saver.id,
        query: { ...baseQuery, per_page: 2 },
        currentUser: null,
      });
      expect(firstPage.data).toHaveLength(2);
      expect(firstPage.meta.next_cursor).not.toBeNull();

      const secondPage = await service().listInfinite({
        targetUserId: saver.id,
        query: { ...baseQuery, per_page: 2, cursor: firstPage.meta.next_cursor ?? undefined },
        currentUser: null,
      });
      expect(secondPage.data).toHaveLength(1);
      expect(secondPage.meta.next_cursor).toBeNull();
    });
  });
});
