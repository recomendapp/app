import { eq } from 'drizzle-orm';
import { pushToken } from '@libs/db/schemas';
import { createTestSession, createTestUser, TestDatabase } from '@libs/testing';
import { Session } from '../../auth/auth.service';
import { MePushTokensService } from './me-push-tokens.service';

describe('MePushTokensService', () => {
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

  const asSession = (row: { id: string; userId: string }) => row as unknown as Session;

  describe('set', () => {
    it('creates a new push token', async () => {
      const { user } = await createTestUser(testDb.db);
      const session = await createTestSession(testDb.db, { userId: user.id });
      const service = new MePushTokensService(testDb.db);

      const result = await service.set({
        session: asSession(session),
        dto: { provider: 'fcm', token: 'device-token-1', deviceType: 'ios' },
      });

      expect(result.userId).toBe(user.id);
      expect(result.sessionId).toBe(session.id);
      expect(result.provider).toBe('fcm');
      expect(result.token).toBe('device-token-1');
      expect(result.deviceType).toBe('ios');
    });

    it('upserts on the same (user, token, provider), reassigning the session', async () => {
      const { user } = await createTestUser(testDb.db);
      const firstSession = await createTestSession(testDb.db, { userId: user.id });
      const secondSession = await createTestSession(testDb.db, { userId: user.id });
      const service = new MePushTokensService(testDb.db);

      const first = await service.set({
        session: asSession(firstSession),
        dto: { provider: 'fcm', token: 'shared-token', deviceType: 'android' },
      });
      const second = await service.set({
        session: asSession(secondSession),
        dto: { provider: 'fcm', token: 'shared-token', deviceType: 'ios' },
      });

      expect(second.id).toBe(first.id);
      expect(second.sessionId).toBe(secondSession.id);
      expect(second.deviceType).toBe('ios');

      const rows = await testDb.db.select().from(pushToken).where(eq(pushToken.userId, user.id));
      expect(rows).toHaveLength(1);
    });

    it('keeps separate rows for different providers on the same token string', async () => {
      const { user } = await createTestUser(testDb.db);
      const session = await createTestSession(testDb.db, { userId: user.id });
      const service = new MePushTokensService(testDb.db);

      await service.set({
        session: asSession(session),
        dto: { provider: 'fcm', token: 'same-token-value', deviceType: 'android' },
      });
      await service.set({
        session: asSession(session),
        dto: { provider: 'apns', token: 'same-token-value', deviceType: 'ios' },
      });

      const rows = await testDb.db.select().from(pushToken).where(eq(pushToken.userId, user.id));
      expect(rows).toHaveLength(2);
    });

    it('keeps separate rows for the same token registered by two different users', async () => {
      const { user: userA } = await createTestUser(testDb.db);
      const { user: userB } = await createTestUser(testDb.db);
      const sessionA = await createTestSession(testDb.db, { userId: userA.id });
      const sessionB = await createTestSession(testDb.db, { userId: userB.id });
      const service = new MePushTokensService(testDb.db);

      await service.set({
        session: asSession(sessionA),
        dto: { provider: 'fcm', token: 'shared-device-token', deviceType: 'android' },
      });
      await service.set({
        session: asSession(sessionB),
        dto: { provider: 'fcm', token: 'shared-device-token', deviceType: 'android' },
      });

      const rows = await testDb.db.select().from(pushToken);
      expect(rows.filter((r) => r.token === 'shared-device-token')).toHaveLength(2);
    });
  });
});
