import { follow, playlistMember } from '@libs/db/schemas';
import { createTestPlaylist, createTestUser, TestDatabase } from '@libs/testing';
import { User } from '../../../auth/auth.service';
import { PlaylistSortBy } from '../../../playlists/dto/playlists.dto';
import { SortOrder } from '../../../../common/dto/sort.dto';
import { MePlaylistsFollowingService } from './me-playlists-following.service';

describe('MePlaylistsFollowingService', () => {
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

  const baseQuery = { sort_by: PlaylistSortBy.CREATED_AT, sort_order: SortOrder.ASC };

  async function follows(
    followerId: string,
    followingId: string,
    status: 'accepted' | 'pending' = 'accepted',
  ) {
    await testDb.db.insert(follow).values({ followerId, followingId, status });
  }

  describe('listPaginated', () => {
    it('returns an empty array when following no one', async () => {
      const { user } = await createTestUser(testDb.db);
      const service = new MePlaylistsFollowingService(testDb.db);

      const result = await service.listPaginated({
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: asUser(user),
      });

      expect(result.data).toEqual([]);
    });

    it('includes a public playlist from a followed user', async () => {
      const { user: viewer } = await createTestUser(testDb.db);
      const { user: followed } = await createTestUser(testDb.db);
      await follows(viewer.id, followed.id);
      const p = await createTestPlaylist(
        testDb.db,
        { userId: followed.id },
        { visibility: 'public' },
      );
      const service = new MePlaylistsFollowingService(testDb.db);

      const result = await service.listPaginated({
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: asUser(viewer),
      });

      expect(result.data.map((d) => d.id)).toEqual([p.id]);
      expect(result.data[0].owner.id).toBe(followed.id);
    });

    it('excludes a private playlist from a followed user', async () => {
      const { user: viewer } = await createTestUser(testDb.db);
      const { user: followed } = await createTestUser(testDb.db);
      await follows(viewer.id, followed.id);
      await createTestPlaylist(testDb.db, { userId: followed.id }, { visibility: 'private' });
      const service = new MePlaylistsFollowingService(testDb.db);

      const result = await service.listPaginated({
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: asUser(viewer),
      });

      expect(result.data).toEqual([]);
    });

    it('includes a private playlist when the viewer is a member', async () => {
      const { user: viewer } = await createTestUser(testDb.db);
      const { user: followed } = await createTestUser(testDb.db);
      await follows(viewer.id, followed.id);
      const p = await createTestPlaylist(
        testDb.db,
        { userId: followed.id },
        { visibility: 'private' },
      );
      await testDb.db
        .insert(playlistMember)
        .values({ playlistId: p.id, userId: viewer.id, role: 'viewer' });
      const service = new MePlaylistsFollowingService(testDb.db);

      const result = await service.listPaginated({
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: asUser(viewer),
      });

      expect(result.data.map((d) => d.id)).toEqual([p.id]);
    });

    it('includes a "followers"-visibility playlist from an accepted-followed user', async () => {
      const { user: viewer } = await createTestUser(testDb.db);
      const { user: followed } = await createTestUser(testDb.db);
      await follows(viewer.id, followed.id, 'accepted');
      const p = await createTestPlaylist(
        testDb.db,
        { userId: followed.id },
        { visibility: 'followers' },
      );
      const service = new MePlaylistsFollowingService(testDb.db);

      const result = await service.listPaginated({
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: asUser(viewer),
      });

      expect(result.data.map((d) => d.id)).toEqual([p.id]);
    });

    it('excludes playlists from a user with only a pending follow', async () => {
      const { user: viewer } = await createTestUser(testDb.db);
      const { user: pendingFollow } = await createTestUser(testDb.db);
      await follows(viewer.id, pendingFollow.id, 'pending');
      await createTestPlaylist(testDb.db, { userId: pendingFollow.id }, { visibility: 'public' });
      const service = new MePlaylistsFollowingService(testDb.db);

      const result = await service.listPaginated({
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: asUser(viewer),
      });

      expect(result.data).toEqual([]);
    });

    it('excludes the viewer own playlists (following is about other people)', async () => {
      const { user: viewer } = await createTestUser(testDb.db);
      await createTestPlaylist(testDb.db, { userId: viewer.id }, { visibility: 'public' });
      const service = new MePlaylistsFollowingService(testDb.db);

      const result = await service.listPaginated({
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: asUser(viewer),
      });

      expect(result.data).toEqual([]);
    });

    it('paginates results and reports accurate meta', async () => {
      const { user: viewer } = await createTestUser(testDb.db);
      const { user: followed } = await createTestUser(testDb.db);
      await follows(viewer.id, followed.id);
      const playlists = [];
      for (let i = 0; i < 3; i++) {
        playlists.push(
          await createTestPlaylist(testDb.db, { userId: followed.id }, { visibility: 'public' }),
        );
      }
      const service = new MePlaylistsFollowingService(testDb.db);

      const page1 = await service.listPaginated({
        query: { ...baseQuery, page: 1, per_page: 2 },
        currentUser: asUser(viewer),
      });
      expect(page1.data.map((d) => d.id)).toEqual([playlists[0].id, playlists[1].id]);
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
      const { user: viewer } = await createTestUser(testDb.db);
      const { user: followed } = await createTestUser(testDb.db);
      await follows(viewer.id, followed.id);
      const playlists = [];
      for (let i = 0; i < 3; i++) {
        playlists.push(
          await createTestPlaylist(testDb.db, { userId: followed.id }, { visibility: 'public' }),
        );
      }
      const service = new MePlaylistsFollowingService(testDb.db);

      const firstPage = await service.listInfinite({
        query: { ...baseQuery, per_page: 2 },
        currentUser: asUser(viewer),
      });
      expect(firstPage.data.map((d) => d.id)).toEqual([playlists[0].id, playlists[1].id]);
      expect(firstPage.meta.next_cursor).not.toBeNull();

      const secondPage = await service.listInfinite({
        query: { ...baseQuery, per_page: 2, cursor: firstPage.meta.next_cursor ?? undefined },
        currentUser: asUser(viewer),
      });
      expect(secondPage.data.map((d) => d.id)).toEqual([playlists[2].id]);
      expect(secondPage.meta.next_cursor).toBeNull();
    });

    it('sorts by likes_count', async () => {
      const { user: viewer } = await createTestUser(testDb.db);
      const { user: followed } = await createTestUser(testDb.db);
      await follows(viewer.id, followed.id);
      const low = await createTestPlaylist(
        testDb.db,
        { userId: followed.id },
        { visibility: 'public', likesCount: 1 },
      );
      const high = await createTestPlaylist(
        testDb.db,
        { userId: followed.id },
        { visibility: 'public', likesCount: 5 },
      );
      const service = new MePlaylistsFollowingService(testDb.db);

      const result = await service.listInfinite({
        query: { sort_by: PlaylistSortBy.LIKES_COUNT, sort_order: SortOrder.DESC, per_page: 10 },
        currentUser: asUser(viewer),
      });

      expect(result.data.map((d) => d.id)).toEqual([high.id, low.id]);
    });
  });
});
