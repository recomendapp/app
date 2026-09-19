import { BadRequestException, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { playlist, playlistSaved } from '@libs/db/schemas';
import { createTestPlaylist, createTestUser, TestDatabase } from '@libs/testing';
import { PlaylistServerEvents } from '@libs/realtime';
import type { RealtimeGateway } from '../../realtime/realtime.gateway';
import { User } from '../../auth/auth.service';

jest.mock('../../realtime/realtime.gateway', () => ({ RealtimeGateway: jest.fn() }));

const { PlaylistSavesService } =
  require('./playlist-saves.service') as typeof import('./playlist-saves.service');

describe('PlaylistSavesService', () => {
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
    new PlaylistSavesService(testDb.db, gateway ?? fakeGateway());

  describe('get', () => {
    it('returns false when there is no save', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });

      expect(await service().get({ user: asUser(user), playlistId: p.id })).toBe(false);
    });

    it('returns true when a save exists', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });
      await testDb.db.insert(playlistSaved).values({ playlistId: p.id, userId: user.id });

      expect(await service().get({ user: asUser(user), playlistId: p.id })).toBe(true);
    });
  });

  describe('set', () => {
    it('throws when the playlist does not exist', async () => {
      const { user } = await createTestUser(testDb.db);

      await expect(service().set({ user: asUser(user), playlistId: 999999 })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('forbids saving your own playlist', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });

      await expect(service().set({ user: asUser(owner), playlistId: p.id })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('creates a save, emits an event, and increments the counter', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });
      const gateway = fakeGateway();

      const result = await service(gateway).set({ user: asUser(user), playlistId: p.id });

      expect(result).toMatchObject({ playlistId: p.id, userId: user.id });
      expect(gateway.emitToUser).toHaveBeenCalledWith(
        user.id,
        PlaylistServerEvents.SAVE_SET,
        result,
      );

      const updated = await testDb.db.query.playlist.findFirst({ where: eq(playlist.id, p.id) });
      expect(updated?.savedCount).toBe(1);
    });

    it('is idempotent: saving twice does not double count and does not re-emit', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });
      await service().set({ user: asUser(user), playlistId: p.id });

      const gateway = fakeGateway();
      await service(gateway).set({ user: asUser(user), playlistId: p.id });

      expect(gateway.emitToUser).not.toHaveBeenCalled();
      const updated = await testDb.db.query.playlist.findFirst({ where: eq(playlist.id, p.id) });
      expect(updated?.savedCount).toBe(1);
    });
  });

  describe('delete', () => {
    it('removes an existing save, emits an event, and decrements the counter', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });
      await service().set({ user: asUser(user), playlistId: p.id });
      const gateway = fakeGateway();

      const result = await service(gateway).delete({ user: asUser(user), playlistId: p.id });

      expect(result).toMatchObject({ playlistId: p.id, userId: user.id });
      expect(gateway.emitToUser).toHaveBeenCalledWith(
        user.id,
        PlaylistServerEvents.SAVE_DELETED,
        result,
      );

      const updated = await testDb.db.query.playlist.findFirst({ where: eq(playlist.id, p.id) });
      expect(updated?.savedCount).toBe(0);
    });

    it('returns null and does not emit when there was no save', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });
      const gateway = fakeGateway();

      const result = await service(gateway).delete({ user: asUser(user), playlistId: p.id });

      expect(result).toBeNull();
      expect(gateway.emitToUser).not.toHaveBeenCalled();
    });
  });
});
