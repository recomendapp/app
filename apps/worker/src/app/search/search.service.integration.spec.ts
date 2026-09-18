import { createTestPlaylist, createTestUser, TestDatabase } from '@libs/testing';
import { playlistMember } from '@libs/db/schemas';
import { SearchService } from './search.service';

function createFakeTypesense() {
  const deleteFn = jest.fn().mockResolvedValue(undefined);
  const upsertFn = jest.fn().mockResolvedValue(undefined);
  const documentsFn = jest.fn().mockReturnValue({ delete: deleteFn, upsert: upsertFn });
  const collectionsFn = jest.fn().mockReturnValue({ documents: documentsFn });

  return {
    client: { collections: collectionsFn } as any,
    collectionsFn,
    documentsFn,
    deleteFn,
    upsertFn,
  };
}

describe('SearchService', () => {
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

  describe('syncUser', () => {
    it('deletes the user document from the users collection', async () => {
      const typesense = createFakeTypesense();
      const service = new SearchService(testDb.db, typesense.client);
      const { user } = await createTestUser(testDb.db);

      await service.syncUser({ userId: user.id, action: 'delete' });

      expect(typesense.collectionsFn).toHaveBeenCalledWith('users');
      expect(typesense.documentsFn).toHaveBeenCalledWith(user.id.toString());
      expect(typesense.deleteFn).toHaveBeenCalledTimes(1);
    });

    it('swallows delete errors (e.g. document already absent) instead of throwing', async () => {
      const typesense = createFakeTypesense();
      typesense.deleteFn.mockRejectedValue(new Error('not found'));
      const service = new SearchService(testDb.db, typesense.client);
      const { user } = await createTestUser(testDb.db);

      await expect(
        service.syncUser({ userId: user.id, action: 'delete' }),
      ).resolves.toBeUndefined();
    });

    it('does nothing (no typesense call) when the user no longer exists', async () => {
      const typesense = createFakeTypesense();
      const service = new SearchService(testDb.db, typesense.client);

      await service.syncUser({
        userId: '00000000-0000-0000-0000-000000000000',
        action: 'upsert',
      });

      expect(typesense.collectionsFn).not.toHaveBeenCalled();
    });

    it('upserts a document with id/username/name/followers_count', async () => {
      const typesense = createFakeTypesense();
      const service = new SearchService(testDb.db, typesense.client);
      const { user, profile } = await createTestUser(testDb.db, {
        user: { name: 'Alice Doe', username: 'alice_doe' },
        profile: { followersCount: 42 },
      });

      await service.syncUser({ userId: user.id, action: 'upsert' });

      expect(typesense.collectionsFn).toHaveBeenCalledWith('users');
      expect(typesense.upsertFn).toHaveBeenCalledWith({
        id: user.id,
        username: 'alice_doe',
        name: 'Alice Doe',
        followers_count: profile.followersCount,
      });
    });

    it('defaults followers_count to 0 when the profile has none', async () => {
      const typesense = createFakeTypesense();
      const service = new SearchService(testDb.db, typesense.client);
      const { user } = await createTestUser(testDb.db);

      await service.syncUser({ userId: user.id, action: 'upsert' });

      const [document] = typesense.upsertFn.mock.calls[0];
      expect(document.followers_count).toBe(0);
    });

    it('propagates errors from the typesense upsert call so the job can be retried', async () => {
      const typesense = createFakeTypesense();
      typesense.upsertFn.mockRejectedValue(new Error('typesense down'));
      const service = new SearchService(testDb.db, typesense.client);
      const { user } = await createTestUser(testDb.db);

      await expect(service.syncUser({ userId: user.id, action: 'upsert' })).rejects.toThrow(
        'typesense down',
      );
    });
  });

  describe('syncPlaylist', () => {
    it('deletes the playlist document from the playlists collection', async () => {
      const typesense = createFakeTypesense();
      const service = new SearchService(testDb.db, typesense.client);
      const { user } = await createTestUser(testDb.db);
      const playlist = await createTestPlaylist(testDb.db, { userId: user.id });

      await service.syncPlaylist({ playlistId: playlist.id, action: 'delete' });

      expect(typesense.collectionsFn).toHaveBeenCalledWith('playlists');
      expect(typesense.documentsFn).toHaveBeenCalledWith(playlist.id.toString());
      expect(typesense.deleteFn).toHaveBeenCalledTimes(1);
    });

    it('swallows delete errors (e.g. document already absent) instead of throwing', async () => {
      const typesense = createFakeTypesense();
      typesense.deleteFn.mockRejectedValue(new Error('not found'));
      const service = new SearchService(testDb.db, typesense.client);
      const { user } = await createTestUser(testDb.db);
      const playlist = await createTestPlaylist(testDb.db, { userId: user.id });

      await expect(
        service.syncPlaylist({ playlistId: playlist.id, action: 'delete' }),
      ).resolves.toBeUndefined();
    });

    it('does nothing (no typesense call) when the playlist no longer exists', async () => {
      const typesense = createFakeTypesense();
      const service = new SearchService(testDb.db, typesense.client);

      await service.syncPlaylist({ playlistId: 999999999, action: 'upsert' });

      expect(typesense.collectionsFn).not.toHaveBeenCalled();
    });

    it('upserts a document with every field mapped, including member ids', async () => {
      const typesense = createFakeTypesense();
      const service = new SearchService(testDb.db, typesense.client);
      const { user: owner } = await createTestUser(testDb.db);
      const { user: memberA } = await createTestUser(testDb.db);
      const { user: memberB } = await createTestUser(testDb.db);
      const playlist = await createTestPlaylist(
        testDb.db,
        { userId: owner.id },
        {
          title: 'My Playlist',
          description: 'A description',
          visibility: 'private',
        },
      );
      await testDb.db.insert(playlistMember).values([
        { playlistId: playlist.id, userId: memberA.id },
        { playlistId: playlist.id, userId: memberB.id },
      ]);

      await service.syncPlaylist({ playlistId: playlist.id, action: 'upsert' });

      expect(typesense.collectionsFn).toHaveBeenCalledWith('playlists');
      const [document] = typesense.upsertFn.mock.calls[0];
      expect(document).toEqual({
        id: playlist.id.toString(),
        title: 'My Playlist',
        description: 'A description',
        likes_count: 0,
        items_count: 0,
        created_at: new Date(playlist.createdAt).getTime(),
        updated_at: new Date(playlist.updatedAt).getTime(),
        visibility: 'private',
        owner_id: owner.id,
        member_ids: expect.arrayContaining([memberA.id, memberB.id]),
      });
      expect(document.member_ids).toHaveLength(2);
    });

    it('upserts with an empty member_ids array when the playlist has no members', async () => {
      const typesense = createFakeTypesense();
      const service = new SearchService(testDb.db, typesense.client);
      const { user: owner } = await createTestUser(testDb.db);
      const playlist = await createTestPlaylist(testDb.db, { userId: owner.id });

      await service.syncPlaylist({ playlistId: playlist.id, action: 'upsert' });

      const [document] = typesense.upsertFn.mock.calls[0];
      expect(document.member_ids).toEqual([]);
    });

    it('propagates errors from the typesense upsert call so the job can be retried (regression: this used to be silently swallowed)', async () => {
      const typesense = createFakeTypesense();
      typesense.upsertFn.mockRejectedValue(new Error('typesense down'));
      const service = new SearchService(testDb.db, typesense.client);
      const { user: owner } = await createTestUser(testDb.db);
      const playlist = await createTestPlaylist(testDb.db, { userId: owner.id });

      await expect(
        service.syncPlaylist({ playlistId: playlist.id, action: 'upsert' }),
      ).rejects.toThrow('typesense down');
    });
  });
});
