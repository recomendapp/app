import { eq } from 'drizzle-orm';
import { profile } from '@libs/db/schemas';
import { createTestUser, TestDatabase } from '@libs/testing';
import type { EnvService } from '@libs/env';
import { WebhookRevenuecatService } from './webhook-revenuecat.service';

describe('WebhookRevenuecatService', () => {
  let testDb: TestDatabase;
  let fetchSpy: jest.SpiedFunction<typeof fetch>;

  beforeAll(async () => {
    testDb = await TestDatabase.create();
  });

  afterEach(async () => {
    fetchSpy?.mockRestore();
    await testDb.reset();
  });

  afterAll(async () => {
    await testDb.close();
  });

  const fakeEnv = { REVENUECAT_API_KEY: 'test-rc-key' } as EnvService;

  function buildService() {
    return new WebhookRevenuecatService(fakeEnv, testDb.db);
  }

  function mockSubscriberResponse(entitlements: Record<string, { expires_date: string | null }>) {
    fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ subscriber: { entitlements } }),
    } as unknown as Response);
  }

  async function getIsPremium(userId: string): Promise<boolean> {
    const [row] = await testDb.db
      .select({ isPremium: profile.isPremium })
      .from(profile)
      .where(eq(profile.id, userId));
    return row.isPremium;
  }

  describe('handleEvent', () => {
    it('does nothing and returns success when no id in the event is a valid UUID', async () => {
      mockSubscriberResponse({});
      const service = buildService();

      const result = await service.handleEvent({ type: 'TEST', app_user_id: 'not-a-uuid' });

      expect(result).toEqual({ success: true });
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('activates premium when the entitlement never expires', async () => {
      const { user } = await createTestUser(testDb.db);
      mockSubscriberResponse({ premium: { expires_date: null } });
      const service = buildService();

      await service.handleEvent({ type: 'INITIAL_PURCHASE', app_user_id: user.id });

      expect(await getIsPremium(user.id)).toBe(true);
    });

    it('activates premium when the entitlement expires in the future', async () => {
      const { user } = await createTestUser(testDb.db);
      const future = new Date(Date.now() + 60_000).toISOString();
      mockSubscriberResponse({ premium: { expires_date: future } });
      const service = buildService();

      await service.handleEvent({ type: 'RENEWAL', app_user_id: user.id });

      expect(await getIsPremium(user.id)).toBe(true);
    });

    it('does not activate premium when the entitlement already expired', async () => {
      const { user } = await createTestUser(testDb.db);
      const past = new Date(Date.now() - 60_000).toISOString();
      mockSubscriberResponse({ premium: { expires_date: past } });
      const service = buildService();

      await service.handleEvent({ type: 'EXPIRATION', app_user_id: user.id });

      expect(await getIsPremium(user.id)).toBe(false);
    });

    it('does not activate premium when there is no premium entitlement at all', async () => {
      const { user } = await createTestUser(testDb.db);
      mockSubscriberResponse({});
      const service = buildService();

      await service.handleEvent({ type: 'TEST', app_user_id: user.id });

      expect(await getIsPremium(user.id)).toBe(false);
    });

    it('deactivates premium on an existing user whose entitlement lapsed', async () => {
      const { user } = await createTestUser(testDb.db);
      await testDb.db.update(profile).set({ isPremium: true }).where(eq(profile.id, user.id));
      const past = new Date(Date.now() - 60_000).toISOString();
      mockSubscriberResponse({ premium: { expires_date: past } });
      const service = buildService();

      await service.handleEvent({ type: 'CANCELLATION', app_user_id: user.id });

      expect(await getIsPremium(user.id)).toBe(false);
    });

    it('calls the RevenueCat API with the bearer key and the subscriber id in the url', async () => {
      const { user } = await createTestUser(testDb.db);
      mockSubscriberResponse({ premium: { expires_date: null } });
      const service = buildService();

      await service.handleEvent({ type: 'TEST', app_user_id: user.id });

      expect(fetchSpy).toHaveBeenCalledWith(
        `https://api.revenuecat.com/v1/subscribers/${user.id}`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({ Authorization: 'Bearer test-rc-key' }),
        }),
      );
    });

    it('syncs every unique valid UUID across app_user_id, aliases, transferred_from and transferred_to', async () => {
      const { user: main } = await createTestUser(testDb.db);
      const { user: alias } = await createTestUser(testDb.db);
      const { user: fromUser } = await createTestUser(testDb.db);
      const { user: toUser } = await createTestUser(testDb.db);
      mockSubscriberResponse({ premium: { expires_date: null } });
      const service = buildService();

      await service.handleEvent({
        type: 'TRANSFER',
        app_user_id: main.id,
        aliases: [alias.id, 'not-a-uuid'],
        transferred_from: [fromUser.id],
        transferred_to: [toUser.id],
      });

      expect(fetchSpy).toHaveBeenCalledTimes(4);
      for (const id of [main.id, alias.id, fromUser.id, toUser.id]) {
        expect(await getIsPremium(id)).toBe(true);
      }
    });

    it('dedupes an id that appears in both app_user_id and aliases into a single sync call', async () => {
      const { user } = await createTestUser(testDb.db);
      mockSubscriberResponse({ premium: { expires_date: null } });
      const service = buildService();

      await service.handleEvent({
        type: 'TEST',
        app_user_id: user.id,
        aliases: [user.id],
      });

      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('ignores non-UUID ids and only syncs the valid one', async () => {
      const { user } = await createTestUser(testDb.db);
      mockSubscriberResponse({ premium: { expires_date: null } });
      const service = buildService();

      const result = await service.handleEvent({
        type: 'TEST',
        app_user_id: 'anonymous-device-id',
        aliases: [user.id],
      });

      expect(result).toEqual({ success: true });
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith(
        `https://api.revenuecat.com/v1/subscribers/${user.id}`,
        expect.anything(),
      );
    });

    it('throws when the RevenueCat API call fails', async () => {
      const { user } = await createTestUser(testDb.db);
      fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({}),
      } as unknown as Response);
      const service = buildService();

      await expect(service.handleEvent({ type: 'TEST', app_user_id: user.id })).rejects.toThrow(
        `RC API Error for ${user.id}: 500 Internal Server Error`,
      );
    });
  });
});
