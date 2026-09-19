import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { MultipartFile } from '@fastify/multipart';
import { createTestPlaylist, createTestUser, TestDatabase } from '@libs/testing';
import type { StorageService } from '../../../common/modules/storage/storage.service';
import { PlaylistPosterService } from './playlist-poster.service';

describe('PlaylistPosterService', () => {
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
      await expect(service().set({ playlistId: 999999, file: fakeFile })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('uploads the file and updates the poster', async () => {
      const { user } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: user.id });
      const storage = fakeStorage();

      const result = await service(storage).set({ playlistId: p.id, file: fakeFile });

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

      await service(storage).set({ playlistId: p.id, file: fakeFile });

      expect(storage.deleteFile).toHaveBeenCalledWith('old-poster.png', expect.any(String));
    });

    it('does not attempt to delete anything when there was no previous poster', async () => {
      const { user } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: user.id });
      const storage = fakeStorage();

      await service(storage).set({ playlistId: p.id, file: fakeFile });

      expect(storage.deleteFile).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('throws when the playlist does not exist', async () => {
      await expect(service().delete({ playlistId: 999999 })).rejects.toThrow(NotFoundException);
    });

    it('throws when the playlist has no poster to delete', async () => {
      const { user } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: user.id });

      await expect(service().delete({ playlistId: p.id })).rejects.toThrow(BadRequestException);
    });

    it('clears the poster and deletes the file', async () => {
      const { user } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: user.id }, { poster: 'cover.png' });
      const storage = fakeStorage();

      const result = await service(storage).delete({ playlistId: p.id });

      expect(result.poster).toBeNull();
      expect(storage.deleteFile).toHaveBeenCalledWith('cover.png', expect.any(String));
    });
  });
});
