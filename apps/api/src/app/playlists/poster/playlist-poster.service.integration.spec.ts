import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { MultipartFile } from '@fastify/multipart';
import { createTestPlaylist, createTestUser, TestDatabase } from '@libs/testing';
import type { StorageService } from '../../../common/modules/storage/storage.service';
import { PlaylistPosterService } from './playlist-poster.service';
import { User } from '../../auth/auth.service';

describe('PlaylistPosterService', () => {
  let testDb: TestDatabase;
  const asUser = (row: { id: string }) => row as unknown as User;

  beforeAll(async () => {
    testDb = await TestDatabase.create();
  });

  afterEach(async () => {
    await testDb.reset();
  });

  afterAll(async () => {
    await testDb.close();
  });

  const fakeFile = {} as MultipartFile;

  function fakeStorage(overrides?: Partial<jest.Mocked<StorageService>>) {
    return {
      uploadFile: jest
        .fn()
        .mockResolvedValue({ filename: 'new-poster.png', url: 'https://cdn.test/new-poster.png' }),
      deleteFile: jest.fn().mockResolvedValue(undefined),
      getFileUrl: jest.fn(),
      ...overrides,
    } as unknown as jest.Mocked<StorageService>;
  }

  const service = (storage?: jest.Mocked<StorageService>) =>
    new PlaylistPosterService(testDb.db, storage ?? fakeStorage());

  describe('set', () => {
    it('throws when the playlist does not exist', async () => {
      const { user } = await createTestUser(testDb.db);

      await expect(
        service().set({ user: asUser(user), playlistId: 999999, file: fakeFile }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws when the user is not the owner or an admin', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: stranger } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });

      await expect(
        service().set({ user: asUser(stranger), playlistId: p.id, file: fakeFile }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('uploads the file and updates the poster', async () => {
      const { user } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: user.id });
      const storage = fakeStorage();

      const result = await service(storage).set({
        user: asUser(user),
        playlistId: p.id,
        file: fakeFile,
      });

      expect(storage.uploadFile).toHaveBeenCalledWith(fakeFile, expect.any(String));
      expect(result.poster).not.toBeNull();
    });

    it('deletes the old poster file when replacing an existing one', async () => {
      const { user } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(
        testDb.db,
        { userId: user.id },
        { poster: 'old-poster.png' },
      );
      const storage = fakeStorage();

      await service(storage).set({ user: asUser(user), playlistId: p.id, file: fakeFile });

      expect(storage.deleteFile).toHaveBeenCalledWith('old-poster.png', expect.any(String));
    });

    it('does not attempt to delete anything when there was no previous poster', async () => {
      const { user } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: user.id });
      const storage = fakeStorage();

      await service(storage).set({ user: asUser(user), playlistId: p.id, file: fakeFile });

      expect(storage.deleteFile).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('throws when the playlist does not exist', async () => {
      const { user } = await createTestUser(testDb.db);

      await expect(service().delete({ user: asUser(user), playlistId: 999999 })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws when the user is not the owner or an admin', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: stranger } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id }, { poster: 'cover.png' });

      await expect(service().delete({ user: asUser(stranger), playlistId: p.id })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws when the playlist has no poster to delete', async () => {
      const { user } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: user.id });

      await expect(service().delete({ user: asUser(user), playlistId: p.id })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('clears the poster and deletes the file', async () => {
      const { user } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: user.id }, { poster: 'cover.png' });
      const storage = fakeStorage();

      const result = await service(storage).delete({ user: asUser(user), playlistId: p.id });

      expect(result.poster).toBeNull();
      expect(storage.deleteFile).toHaveBeenCalledWith('cover.png', expect.any(String));
    });
  });
});
