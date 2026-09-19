import { BadRequestException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { user } from '@libs/db/schemas';
import { createTestUser, TestDatabase } from '@libs/testing';
import { User } from '../../auth/auth.service';
import type { RealtimeGateway } from '../../realtime/realtime.gateway';
import type { WorkerClient } from '@shared/worker';
import type { StorageService } from '../../../common/modules/storage/storage.service';
import type { MultipartFile } from '@fastify/multipart';

jest.mock('../../realtime/realtime.gateway', () => ({ RealtimeGateway: jest.fn() }));

const { MeAvatarService } = require('./me-avatar.service') as typeof import('./me-avatar.service');
const { MeService } = require('../me.service') as typeof import('../me.service');

describe('MeAvatarService', () => {
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

  const asUser = (row: { id: string; image?: string | null }) => row as unknown as User;
  const fakeGateway = () => ({ emitToUser: jest.fn() }) as unknown as jest.Mocked<RealtimeGateway>;
  const fakeWorker = () =>
    ({ emit: jest.fn().mockResolvedValue(undefined) }) as unknown as jest.Mocked<WorkerClient>;
  const fakeFile = {} as MultipartFile;

  function fakeStorage(overrides?: Partial<jest.Mocked<StorageService>>) {
    return {
      uploadFile: jest
        .fn()
        .mockResolvedValue({
          filename: 'new-avatar.png',
          url: 'https://cdn.test/avatars/new-avatar.png',
        }),
      deleteFile: jest.fn().mockResolvedValue(undefined),
      getFileUrl: jest.fn(),
      ...overrides,
    } as unknown as jest.Mocked<StorageService>;
  }

  function buildService(storage?: jest.Mocked<StorageService>) {
    const meService = new MeService(testDb.db, fakeWorker(), fakeGateway());
    return new MeAvatarService(testDb.db, storage ?? fakeStorage(), meService);
  }

  async function waitForCall(mockFn: { mock: { calls: unknown[] } }, timeoutMs = 2000) {
    const start = Date.now();
    while (mockFn.mock.calls.length === 0) {
      if (Date.now() - start > timeoutMs)
        throw new Error('Timed out waiting for mock to be called');
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }

  describe('set', () => {
    it('uploads the file and stores the new filename', async () => {
      const { user: createdUser } = await createTestUser(testDb.db);
      const storage = fakeStorage();
      const service = buildService(storage);

      const result = await service.set(asUser(createdUser), fakeFile);

      expect(storage.uploadFile).toHaveBeenCalledWith(fakeFile, 'avatars');
      // `UserDto.avatar` transforms the stored filename into a full asset URL.
      expect(result.avatar).toContain('new-avatar.png');

      const [row] = await testDb.db.select().from(user).where(eq(user.id, createdUser.id));
      expect(row.image).toBe('new-avatar.png');
    });

    it('deletes the previous avatar when one existed', async () => {
      const { user: createdUser } = await createTestUser(testDb.db, {
        user: { image: 'old-avatar.png' },
      });
      const storage = fakeStorage();
      const service = buildService(storage);

      await service.set(asUser(createdUser), fakeFile);

      await waitForCall(storage.deleteFile);
      expect(storage.deleteFile).toHaveBeenCalledWith('old-avatar.png', 'avatars');
    });

    it('does not try to delete when there was no previous avatar', async () => {
      const { user: createdUser } = await createTestUser(testDb.db, { user: { image: null } });
      const storage = fakeStorage();
      const service = buildService(storage);

      await service.set(asUser(createdUser), fakeFile);

      expect(storage.deleteFile).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('throws when the user has no avatar', async () => {
      const { user: createdUser } = await createTestUser(testDb.db, { user: { image: null } });
      const service = buildService();

      await expect(service.delete(asUser(createdUser))).rejects.toThrow(BadRequestException);
    });

    it('clears the avatar and deletes the file', async () => {
      const { user: createdUser } = await createTestUser(testDb.db, {
        user: { image: 'old-avatar.png' },
      });
      const storage = fakeStorage();
      const service = buildService(storage);

      const result = await service.delete(asUser(createdUser));

      expect(result.avatar).toBeNull();
      expect(storage.deleteFile).toHaveBeenCalledWith('old-avatar.png', 'avatars');

      const [row] = await testDb.db.select().from(user).where(eq(user.id, createdUser.id));
      expect(row.image).toBeNull();
    });
  });
});
