import { follow } from '@libs/db/schemas';
import { createTestPlaylist, createTestUser, TestDatabase } from '@libs/testing';
import { User } from '../../auth/auth.service';
import { PlaylistSortBy } from '../../playlists/dto/playlists.dto';
import { SortOrder } from '../../../common/dto/sort.dto';
import { UserPlaylistsService } from './user-playlists.service';

describe('UserPlaylistsService', () => {
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
  const service = () => new UserPlaylistsService(testDb.db);
  const baseQuery = { sort_by: PlaylistSortBy.CREATED_AT, sort_order: SortOrder.ASC };

  describe('visibility', () => {
    it('lists a public playlist for anyone', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id }, { visibility: 'public' });

      const result = await service().listPaginated({
        targetUserId: owner.id,
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: null,
      });

      expect(result.data.map((r) => r.id)).toEqual([p.id]);
    });

    it('hides a private playlist from an anonymous viewer', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      await createTestPlaylist(testDb.db, { userId: owner.id }, { visibility: 'private' });

      const result = await service().listPaginated({
        targetUserId: owner.id,
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: null,
      });

      expect(result.data).toEqual([]);
    });

    it('shows a private playlist to its owner', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(
        testDb.db,
        { userId: owner.id },
        { visibility: 'private' },
      );

      const result = await service().listPaginated({
        targetUserId: owner.id,
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: asUser(owner),
      });

      expect(result.data.map((r) => r.id)).toEqual([p.id]);
    });

    it('hides a followers-only playlist from a non-follower', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: stranger } = await createTestUser(testDb.db);
      await createTestPlaylist(testDb.db, { userId: owner.id }, { visibility: 'followers' });

      const result = await service().listPaginated({
        targetUserId: owner.id,
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: asUser(stranger),
      });

      expect(result.data).toEqual([]);
    });

    it('shows a followers-only playlist to an accepted follower of that specific owner', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: follower } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(
        testDb.db,
        { userId: owner.id },
        { visibility: 'followers' },
      );
      await testDb.db
        .insert(follow)
        .values({ followerId: follower.id, followingId: owner.id, status: 'accepted' });

      const result = await service().listPaginated({
        targetUserId: owner.id,
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: asUser(follower),
      });

      expect(result.data.map((r) => r.id)).toEqual([p.id]);
    });

    it('does not treat following someone else as following the target', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: thirdParty } = await createTestUser(testDb.db);
      const { user: follower } = await createTestUser(testDb.db);
      await createTestPlaylist(testDb.db, { userId: owner.id }, { visibility: 'followers' });
      // follower follows a third party, not the playlist owner.
      await testDb.db
        .insert(follow)
        .values({ followerId: follower.id, followingId: thirdParty.id, status: 'accepted' });

      const result = await service().listPaginated({
        targetUserId: owner.id,
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: asUser(follower),
      });

      expect(result.data).toEqual([]);
    });
  });

  describe('listing correctness', () => {
    it('does not leak another user playlists', async () => {
      const { user: a } = await createTestUser(testDb.db);
      const { user: b } = await createTestUser(testDb.db);
      await createTestPlaylist(testDb.db, { userId: b.id }, { visibility: 'public' });

      const result = await service().listPaginated({
        targetUserId: a.id,
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: null,
      });

      expect(result.data).toEqual([]);
    });

    it('paginates results and reports accurate meta', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      for (let i = 0; i < 3; i++)
        await createTestPlaylist(testDb.db, { userId: owner.id }, { visibility: 'public' });

      const page1 = await service().listPaginated({
        targetUserId: owner.id,
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
      for (let i = 0; i < 3; i++)
        await createTestPlaylist(testDb.db, { userId: owner.id }, { visibility: 'public' });

      const firstPage = await service().listInfinite({
        targetUserId: owner.id,
        query: { ...baseQuery, per_page: 2 },
        currentUser: null,
      });
      expect(firstPage.data).toHaveLength(2);
      expect(firstPage.meta.next_cursor).not.toBeNull();

      const secondPage = await service().listInfinite({
        targetUserId: owner.id,
        query: { ...baseQuery, per_page: 2, cursor: firstPage.meta.next_cursor ?? undefined },
        currentUser: null,
      });
      expect(secondPage.data).toHaveLength(1);
      expect(secondPage.meta.next_cursor).toBeNull();
    });
  });
});
