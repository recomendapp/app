import { BadRequestException, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { user } from '@libs/db/schemas';
import { createTestUser, TestDatabase } from '@libs/testing';
import { defaultSupportedLocale } from '@libs/i18n';
import { User } from '../auth/auth.service';
import { MeServerEvents } from '@libs/realtime';
import type { RealtimeGateway } from '../realtime/realtime.gateway';
import type { WorkerClient } from '@shared/worker';

jest.mock('../realtime/realtime.gateway', () => ({ RealtimeGateway: jest.fn() }));

const { MeService } = require('./me.service') as typeof import('./me.service');

describe('MeService', () => {
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
  const fakeWorker = () =>
    ({ emit: jest.fn().mockResolvedValue(undefined) }) as unknown as jest.Mocked<WorkerClient>;

  function buildService(opts?: {
    worker?: jest.Mocked<WorkerClient>;
    gateway?: jest.Mocked<RealtimeGateway>;
  }) {
    return new MeService(testDb.db, opts?.worker ?? fakeWorker(), opts?.gateway ?? fakeGateway());
  }

  describe('get', () => {
    it('throws when the user does not exist', async () => {
      const service = buildService();

      await expect(
        service.get(asUser({ id: '00000000-0000-0000-0000-000000000000' })),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns the user merged with their profile', async () => {
      const { user: createdUser, profile } = await createTestUser(testDb.db, {
        user: { name: 'Loup', username: 'loup_test' },
        profile: { bio: 'Movie lover', isPrivate: true },
      });
      const service = buildService();

      const result = await service.get(asUser(createdUser));

      expect(result.id).toBe(createdUser.id);
      expect(result.name).toBe('Loup');
      expect(result.username).toBe('loup_test');
      expect(result.bio).toBe('Movie lover');
      expect(result.isPrivate).toBe(true);
      expect(result.isPremium).toBe(profile.isPremium);
    });
  });

  describe('update', () => {
    it('updates the name and triggers a search sync', async () => {
      const { user: createdUser } = await createTestUser(testDb.db);
      const worker = fakeWorker();
      const service = buildService({ worker });

      const result = await service.update(asUser(createdUser), { name: 'New Name' });

      expect(result.name).toBe('New Name');
      expect(worker.emit).toHaveBeenCalledWith('search:sync-user', {
        userId: createdUser.id,
        action: 'upsert',
      });
    });

    it('updates bio and isPrivate without touching the user table', async () => {
      const { user: createdUser } = await createTestUser(testDb.db);
      const worker = fakeWorker();
      const service = buildService({ worker });

      const result = await service.update(asUser(createdUser), { bio: 'New bio', isPrivate: true });

      expect(result.bio).toBe('New bio');
      expect(result.isPrivate).toBe(true);
      expect(worker.emit).not.toHaveBeenCalled();
    });

    it('sets welcomedAt when welcomed is true', async () => {
      const { user: createdUser } = await createTestUser(testDb.db);
      const service = buildService();

      const result = await service.update(asUser(createdUser), { welcomed: true });

      expect(result.welcomedAt).not.toBeNull();
    });

    it('changes the username and stamps usernameUpdatedAt', async () => {
      const { user: createdUser } = await createTestUser(testDb.db, {
        user: { username: 'old_name' },
      });
      const service = buildService();

      const result = await service.update(asUser(createdUser), { username: 'new_name' });

      expect(result.username).toBe('new_name');
      expect(result.usernameUpdatedAt).not.toBeNull();
    });

    it('rejects a username change within 30 days of the last one', async () => {
      const { user: createdUser } = await createTestUser(testDb.db, {
        user: { username: 'old_name', usernameUpdatedAt: new Date().toISOString() },
      });
      const service = buildService();

      await expect(service.update(asUser(createdUser), { username: 'new_name' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('allows a username change after 30 days', async () => {
      const thirtyOneDaysAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
      const { user: createdUser } = await createTestUser(testDb.db, {
        user: { username: 'old_name', usernameUpdatedAt: thirtyOneDaysAgo },
      });
      const service = buildService();

      const result = await service.update(asUser(createdUser), { username: 'new_name' });

      expect(result.username).toBe('new_name');
    });

    it('does not treat setting the same username as a change', async () => {
      const { user: createdUser } = await createTestUser(testDb.db, {
        user: { username: 'same_name', usernameUpdatedAt: new Date().toISOString() },
      });
      const service = buildService();

      // Same value as the current username, requested right after a real change — must not
      // trip the 30-day cooldown since it isn't actually a change.
      await expect(
        service.update(asUser(createdUser), { username: 'same_name' }),
      ).resolves.toBeDefined();
    });

    it('emits an UPDATED realtime event', async () => {
      const { user: createdUser } = await createTestUser(testDb.db);
      const gateway = fakeGateway();
      const service = buildService({ gateway });

      const result = await service.update(asUser(createdUser), { name: 'Realtime Name' });

      expect(gateway.emitToUser).toHaveBeenCalledWith(
        createdUser.id,
        MeServerEvents.UPDATED,
        result,
      );
    });

    it('persists the language change', async () => {
      const { user: createdUser } = await createTestUser(testDb.db);
      const service = buildService();

      await service.update(asUser(createdUser), { language: defaultSupportedLocale });

      const [row] = await testDb.db.select().from(user).where(eq(user.id, createdUser.id));
      expect(row.language).toBe(defaultSupportedLocale);
    });
  });
});
