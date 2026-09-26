import { NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { playlist, playlistLike } from '@libs/db/schemas';
import { createTestPlaylist, createTestUser, TestDatabase } from '@libs/testing';
import { PlaylistServerEvents } from '@libs/realtime';
import type { RealtimeGateway } from '../../realtime/realtime.gateway';
import { User } from '../../auth/auth.service';

jest.mock('../../realtime/realtime.gateway', () => ({ RealtimeGateway: jest.fn() }));

const { PlaylistLikesService } =
  require('./playlist-likes.service') as typeof import('./playlist-likes.service');

describe('PlaylistLikesService', () => {
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
  const fakeGateway = () => ({ emitToUser: jest.fn() }) as unknown as jest.Mocked<RealtimeGateway>;
  const service = (gateway?: jest.Mocked<RealtimeGateway>) =>
    new PlaylistLikesService(testDb.db, gateway ?? fakeGateway());

  describe('get', () => {
    it('returns false when there is no like', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });

      expect(await service().get({ user: asUser(user), playlistId: p.id })).toBe(false);
    });

    it('returns true when a like exists', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });
      await testDb.db.insert(playlistLike).values({ playlistId: p.id, userId: user.id });

      expect(await service().get({ user: asUser(user), playlistId: p.id })).toBe(true);
    });
  });

  describe('set', () => {
    it('creates a like, emits an event, and increments the counter', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });
      const gateway = fakeGateway();

      const result = await service(gateway).set({ user: asUser(user), playlistId: p.id });

      expect(result).toMatchObject({ playlistId: p.id, userId: user.id });
      expect(gateway.emitToUser).toHaveBeenCalledWith(
        user.id,
        PlaylistServerEvents.LIKE_SET,
        result,
      );

      const updated = await testDb.db.query.playlist.findFirst({ where: eq(playlist.id, p.id) });
      expect(updated?.likesCount).toBe(1);
    });

    it('is idempotent: liking twice does not double count and does not re-emit', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });
      await service().set({ user: asUser(user), playlistId: p.id });

      const gateway = fakeGateway();
      const second = await service(gateway).set({ user: asUser(user), playlistId: p.id });

      expect(second).toMatchObject({ playlistId: p.id, userId: user.id });
      expect(gateway.emitToUser).not.toHaveBeenCalled();

      const updated = await testDb.db.query.playlist.findFirst({ where: eq(playlist.id, p.id) });
      expect(updated?.likesCount).toBe(1);
    });

    it('throws when the playlist does not exist', async () => {
      const { user } = await createTestUser(testDb.db);

      await expect(service().set({ user: asUser(user), playlistId: 999999 })).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('removes an existing like, emits an event, and decrements the counter', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });
      await service().set({ user: asUser(user), playlistId: p.id });
      const gateway = fakeGateway();

      const result = await service(gateway).delete({ user: asUser(user), playlistId: p.id });

      expect(result).toMatchObject({ playlistId: p.id, userId: user.id });
      expect(gateway.emitToUser).toHaveBeenCalledWith(
        user.id,
        PlaylistServerEvents.LIKE_DELETED,
        result,
      );

      const updated = await testDb.db.query.playlist.findFirst({ where: eq(playlist.id, p.id) });
      expect(updated?.likesCount).toBe(0);
    });

    it('returns null and does not emit when there was no like', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });
      const gateway = fakeGateway();

      const result = await service(gateway).delete({ user: asUser(user), playlistId: p.id });

      expect(result).toBeNull();
      expect(gateway.emitToUser).not.toHaveBeenCalled();
    });

    it('does not affect another user like on the same playlist', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: userA } = await createTestUser(testDb.db);
      const { user: userB } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });
      await service().set({ user: asUser(userA), playlistId: p.id });
      await service().set({ user: asUser(userB), playlistId: p.id });

      await service().delete({ user: asUser(userA), playlistId: p.id });

      expect(await service().get({ user: asUser(userB), playlistId: p.id })).toBe(true);
      const updated = await testDb.db.query.playlist.findFirst({ where: eq(playlist.id, p.id) });
      expect(updated?.likesCount).toBe(1);
    });
  });

  describe('visibility', () => {
    it('hides a private playlist of another user behind a NotFoundException', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: stranger } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(
        testDb.db,
        { userId: owner.id },
        { visibility: 'private' },
      );

      await expect(service().set({ user: asUser(stranger), playlistId: p.id })).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
