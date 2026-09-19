import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { playlist, playlistItem, playlistMember } from '@libs/db/schemas';
import { createTestMovie, createTestPlaylist, createTestUser, TestDatabase } from '@libs/testing';
import { PlaylistServerEvents } from '@libs/realtime';
import type { RealtimeGateway } from '../realtime/realtime.gateway';
import type { WorkerClient } from '@shared/worker';
import type { StorageService } from '../../common/modules/storage/storage.service';
import { User } from '../auth/auth.service';

jest.mock('../realtime/realtime.gateway', () => ({ RealtimeGateway: jest.fn() }));

const { PlaylistsService } = require('./playlists.service') as typeof import('./playlists.service');
const { PlaylistsRealtimeService } =
  require('./playlists-realtime.service') as typeof import('./playlists-realtime.service');

describe('PlaylistsService', () => {
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
  const fakeGateway = () =>
    ({ emitToUser: jest.fn(), emitToUsers: jest.fn() }) as unknown as jest.Mocked<RealtimeGateway>;
  const fakeWorker = () =>
    ({ emit: jest.fn().mockResolvedValue(undefined) }) as unknown as jest.Mocked<WorkerClient>;
  const fakeStorage = () =>
    ({
      uploadFile: jest.fn(),
      deleteFile: jest.fn().mockResolvedValue(undefined),
      getFileUrl: jest.fn(),
    }) as unknown as jest.Mocked<StorageService>;

  function buildService(overrides?: {
    gateway?: jest.Mocked<RealtimeGateway>;
    worker?: jest.Mocked<WorkerClient>;
    storage?: jest.Mocked<StorageService>;
  }) {
    const gateway = overrides?.gateway ?? fakeGateway();
    const worker = overrides?.worker ?? fakeWorker();
    const storage = overrides?.storage ?? fakeStorage();
    const realtime = new PlaylistsRealtimeService(testDb.db, gateway);
    const service = new PlaylistsService(testDb.db, storage, worker, realtime);
    return { service, gateway, worker, storage };
  }

  async function waitFor(mockFn: { mock: { calls: unknown[] } }, timeoutMs = 2000) {
    const start = Date.now();
    while (mockFn.mock.calls.length === 0) {
      if (Date.now() - start > timeoutMs) throw new Error('Timed out waiting for mock call');
      await new Promise((r) => setTimeout(r, 10));
    }
  }

  describe('get', () => {
    it('throws when the playlist does not exist', async () => {
      const { service } = buildService();

      await expect(service.get({ playlistId: 999999, user: null })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('hides a private playlist from an anonymous user', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(
        testDb.db,
        { userId: owner.id },
        { visibility: 'private' },
      );
      const { service } = buildService();

      await expect(service.get({ playlistId: p.id, user: null })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns the playlist with role owner and the owner summary for the owner', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(
        testDb.db,
        { userId: owner.id },
        { visibility: 'private' },
      );
      const { service } = buildService();

      const result = await service.get({ playlistId: p.id, user: asUser(owner) });

      expect(result.id).toBe(p.id);
      expect(result.role).toBe('owner');
      expect(result.owner).toMatchObject({ id: owner.id, username: owner.username });
    });

    it('downgrades a non-premium owner member role to viewer', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: member } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(
        testDb.db,
        { userId: owner.id },
        { visibility: 'private' },
      );
      await testDb.db
        .insert(playlistMember)
        .values({ playlistId: p.id, userId: member.id, role: 'admin' });
      const { service } = buildService();

      const result = await service.get({ playlistId: p.id, user: asUser(member) });

      expect(result.role).toBe('viewer');
    });

    it('reports role null for an anonymous viewer of a public playlist', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id }, { visibility: 'public' });
      const { service } = buildService();

      const result = await service.get({ playlistId: p.id, user: null });

      expect(result.role).toBeNull();
    });
  });

  describe('create', () => {
    it('creates a playlist owned by the current user with zeroed counters', async () => {
      const { user } = await createTestUser(testDb.db);
      const { service } = buildService();

      const result = await service.create(asUser(user), {
        title: 'My Playlist',
        description: null,
        visibility: 'public',
      });

      expect(result.userId).toBe(user.id);
      expect(result.itemsCount).toBe(0);
      expect(result.likesCount).toBe(0);
      expect(result.savedCount).toBe(0);
    });

    it('broadcasts a CREATED event to the owner', async () => {
      const { user } = await createTestUser(testDb.db);
      const { service, gateway } = buildService();

      const result = await service.create(asUser(user), {
        title: 'My Playlist',
        description: null,
        visibility: 'public',
      });

      expect(gateway.emitToUser).toHaveBeenCalledWith(
        user.id,
        PlaylistServerEvents.CREATED,
        expect.objectContaining({ id: result.id }),
      );
    });

    it('fires a fire-and-forget search sync event', async () => {
      const { user } = await createTestUser(testDb.db);
      const worker = fakeWorker();
      const { service } = buildService({ worker });

      await service.create(asUser(user), {
        title: 'My Playlist',
        description: null,
        visibility: 'public',
      });

      await waitFor(worker.emit);
      expect(worker.emit).toHaveBeenCalledWith(
        'search:sync-playlist',
        expect.objectContaining({ action: 'upsert' }),
      );
    });
  });

  describe('update', () => {
    it('throws when a non-owner tries to change visibility', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });
      const { service } = buildService();

      await expect(
        service.update({
          role: 'admin',
          playlistId: p.id,
          updatePlaylistDto: { visibility: 'private' },
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows an admin to update the title without touching visibility', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id }, { title: 'Old Title' });
      const { service } = buildService();

      const result = await service.update({
        role: 'admin',
        playlistId: p.id,
        updatePlaylistDto: { title: 'New Title' },
      });

      expect(result.title).toBe('New Title');
    });

    it('allows the owner to change visibility', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id }, { visibility: 'public' });
      const { service } = buildService();

      const result = await service.update({
        role: 'owner',
        playlistId: p.id,
        updatePlaylistDto: { visibility: 'private' },
      });

      expect(result.visibility).toBe('private');
    });

    it('throws when the playlist does not exist', async () => {
      const { service } = buildService();

      await expect(
        service.update({ role: 'owner', playlistId: 999999, updatePlaylistDto: { title: 'X' } }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('duplicate', () => {
    it('copies title and description but forces the visibility to private', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: duplicator } = await createTestUser(testDb.db);
      const source = await createTestPlaylist(
        testDb.db,
        { userId: owner.id },
        { title: 'Source', description: 'A description', visibility: 'public' },
      );
      const { service } = buildService();

      const result = await service.duplicate({ user: asUser(duplicator), playlistId: source.id });

      expect(result.userId).toBe(duplicator.id);
      expect(result.title).toBe('Source');
      expect(result.description).toBe('A description');
      expect(result.visibility).toBe('private');
    });

    it('copies the items of the source playlist, preserving rank', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: duplicator } = await createTestUser(testDb.db);
      const source = await createTestPlaylist(testDb.db, { userId: owner.id });
      const movie = await createTestMovie(testDb.db);
      await testDb.db
        .insert(playlistItem)
        .values({
          playlistId: source.id,
          userId: owner.id,
          type: 'movie',
          movieId: movie.id,
          rank: '0|i0000r:',
        });
      const { service } = buildService();

      const result = await service.duplicate({ user: asUser(duplicator), playlistId: source.id });

      const copiedItems = await testDb.db
        .select()
        .from(playlistItem)
        .where(eq(playlistItem.playlistId, result.id));
      expect(copiedItems).toHaveLength(1);
      expect(copiedItems[0]).toMatchObject({
        movieId: movie.id,
        rank: '0|i0000r:',
        userId: duplicator.id,
      });
      expect(result.itemsCount).toBe(1);
    });

    it('throws when the source playlist does not exist', async () => {
      const { user } = await createTestUser(testDb.db);
      const { service } = buildService();

      await expect(service.duplicate({ user: asUser(user), playlistId: 999999 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('deletes the playlist and cascades its items', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });
      const movie = await createTestMovie(testDb.db);
      await testDb.db
        .insert(playlistItem)
        .values({
          playlistId: p.id,
          userId: owner.id,
          type: 'movie',
          movieId: movie.id,
          rank: '0|i0000r:',
        });
      const { service } = buildService();

      await service.delete({ playlistId: p.id });

      const remaining = await testDb.db.select().from(playlist).where(eq(playlist.id, p.id));
      expect(remaining).toHaveLength(0);
      const remainingItems = await testDb.db
        .select()
        .from(playlistItem)
        .where(eq(playlistItem.playlistId, p.id));
      expect(remainingItems).toHaveLength(0);
    });

    it('deletes the poster file when one is set, but not otherwise', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const withPoster = await createTestPlaylist(
        testDb.db,
        { userId: owner.id },
        { poster: 'cover.jpg' },
      );
      const withoutPoster = await createTestPlaylist(testDb.db, { userId: owner.id });
      const storage = fakeStorage();
      const { service } = buildService({ storage });

      await service.delete({ playlistId: withPoster.id });
      await waitFor(storage.deleteFile);
      expect(storage.deleteFile).toHaveBeenCalledWith('cover.jpg', expect.any(String));

      storage.deleteFile.mockClear();
      await service.delete({ playlistId: withoutPoster.id });
      await new Promise((r) => setTimeout(r, 50));
      expect(storage.deleteFile).not.toHaveBeenCalled();
    });

    it('throws when the playlist does not exist', async () => {
      const { service } = buildService();

      await expect(service.delete({ playlistId: 999999 })).rejects.toThrow(NotFoundException);
    });
  });
});
