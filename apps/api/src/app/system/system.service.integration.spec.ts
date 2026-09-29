import { describe, it, expect, beforeAll, afterAll, afterEach } from 'bun:test';
import { and, eq } from 'drizzle-orm';
import { systemConfig, versionPolicy } from '@libs/db/schemas';
import { TestDatabase } from '@libs/testing';
import { SystemService } from './system.service';
import type { CacheService } from '../../common/modules/cache/cache.service';
import type { PrefectService } from '../../common/modules/prefect/prefect.service';

/** In-memory stand-in for the Redis-backed CacheService; TTL is ignored on purpose. */
class FakeCacheService {
  private readonly store = new Map<string, unknown>();
  getCallCount = 0;

  async get<T>(key: string): Promise<T | null> {
    this.getCallCount++;
    return (this.store.get(key) as T | undefined) ?? null;
  }

  async set(key: string, value: unknown): Promise<void> {
    this.store.set(key, value);
  }

  async del(key: string | string[]): Promise<void> {
    for (const k of Array.isArray(key) ? key : [key]) this.store.delete(k);
  }
}

/** Records every trigger call; can be made to fail on demand. */
class FakePrefectService {
  calls: { platform: string; version: string }[] = [];
  shouldFail = false;

  async triggerStoreReleaseWatch(payload: { platform: string; version: string }) {
    this.calls.push(payload);
    if (this.shouldFail) throw new Error('Prefect is down');
    return { id: 'fake-flow-run-id' };
  }
}

describe('SystemService', () => {
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

  const createService = (prefect: FakePrefectService = new FakePrefectService()) =>
    new SystemService(
      testDb.db,
      new FakeCacheService() as unknown as CacheService,
      prefect as unknown as PrefectService,
    );

  describe('getStatus', () => {
    it('reflects the seeded defaults (not under maintenance, up to date at 1.0.0)', async () => {
      const service = createService();

      const result = await service.getStatus({ platform: 'ios', version: '1.6.0' });

      expect(result).toEqual({
        isMaintenance: false,
        version: { status: 'up_to_date', minVersion: '1.0.0', latestVersion: '1.0.0' },
      });
    });

    it('reflects maintenance mode once flipped on', async () => {
      await testDb.db
        .update(systemConfig)
        .set({ value: true })
        .where(eq(systemConfig.key, 'is_maintenance'));
      const service = createService();

      const result = await service.getStatus(null);

      expect(result.isMaintenance).toBe(true);
    });

    it('is neutral (up to date, null versions) when the caller sent no app headers', async () => {
      const service = createService();

      const result = await service.getStatus(null);

      expect(result.version).toEqual({
        status: 'up_to_date',
        minVersion: null,
        latestVersion: null,
      });
    });

    it('requires an update below a live breaking release', async () => {
      await testDb.db
        .insert(versionPolicy)
        .values({ platform: 'ios', version: '2.0.0', isBreaking: true, state: 'live' });
      const service = createService();

      const result = await service.getStatus({ platform: 'ios', version: '1.9.0' });

      expect(result.version.status).toBe('update_required');
      expect(result.version.minVersion).toBe('2.0.0');
    });

    it('offers an update between minVersion and a live non-breaking latest', async () => {
      await testDb.db
        .insert(versionPolicy)
        .values({ platform: 'ios', version: '1.5.0', isBreaking: false, state: 'live' });
      const service = createService();

      const result = await service.getStatus({ platform: 'ios', version: '1.2.0' });

      expect(result.version.status).toBe('update_available');
      expect(result.version.minVersion).toBe('1.0.0');
      expect(result.version.latestVersion).toBe('1.5.0');
    });

    it('ignores a pending release: only `live` rows count', async () => {
      await testDb.db
        .insert(versionPolicy)
        .values({ platform: 'ios', version: '9.9.9', isBreaking: true, state: 'pending' });
      const service = createService();

      const result = await service.getStatus({ platform: 'ios', version: '1.0.0' });

      expect(result.version).toEqual({
        status: 'up_to_date',
        minVersion: '1.0.0',
        latestVersion: '1.0.0',
      });
    });

    it('only applies a platform policy to its own platform', async () => {
      await testDb.db
        .insert(versionPolicy)
        .values({ platform: 'ios', version: '2.0.0', isBreaking: true, state: 'live' });
      const service = createService();

      const android = await service.getStatus({ platform: 'android', version: '1.0.0' });

      expect(android.version.minVersion).toBe('1.0.0');
    });

    it('supports the web platform the same way, once a policy is live for it', async () => {
      await testDb.db
        .insert(versionPolicy)
        .values({ platform: 'web', version: '3.0.0', isBreaking: true, state: 'live' });
      const service = createService();

      const result = await service.getStatus({ platform: 'web', version: '2.9.0' });

      expect(result.version.status).toBe('update_required');
      expect(result.version.minVersion).toBe('3.0.0');
    });

    it('falls back to no policy when a platform has no live row', async () => {
      await testDb.db.delete(versionPolicy).where(eq(versionPolicy.platform, 'ios'));
      const service = createService();

      const result = await service.getStatus({ platform: 'ios', version: '0.0.1' });

      expect(result.version).toEqual({
        status: 'up_to_date',
        minVersion: null,
        latestVersion: null,
      });
    });

    it('falls back to safe defaults when the maintenance config row is missing', async () => {
      await testDb.db.delete(systemConfig).where(eq(systemConfig.key, 'is_maintenance'));
      const service = createService();

      const result = await service.getStatus(null);

      expect(result.isMaintenance).toBe(false);
    });

    it('caches the base status so a second call does not hit the database again', async () => {
      const cache = new FakeCacheService();
      const service = new SystemService(
        testDb.db,
        cache as unknown as CacheService,
        new FakePrefectService() as unknown as PrefectService,
      );

      await service.getStatus(null);
      await testDb.db
        .update(systemConfig)
        .set({ value: true })
        .where(eq(systemConfig.key, 'is_maintenance'));

      // Still reflects the value cached from the first call, not the update above.
      const result = await service.getStatus(null);

      expect(result.isMaintenance).toBe(false);
    });

    it('serves back-to-back calls from L1 without touching Redis again', async () => {
      const cache = new FakeCacheService();
      const service = new SystemService(
        testDb.db,
        cache as unknown as CacheService,
        new FakePrefectService() as unknown as PrefectService,
      );

      await service.getStatus(null);
      await service.getStatus(null);
      await service.getStatus(null);

      expect(cache.getCallCount).toBe(1);
    });

    it('dedupes concurrent calls into a single Redis read', async () => {
      const cache = new FakeCacheService();
      const service = new SystemService(
        testDb.db,
        cache as unknown as CacheService,
        new FakePrefectService() as unknown as PrefectService,
      );

      await Promise.all([
        service.getStatus(null),
        service.getStatus(null),
        service.getStatus(null),
      ]);

      expect(cache.getCallCount).toBe(1);
    });
  });

  describe('getRequiredUpdate', () => {
    it('returns the required update for an outdated app', async () => {
      await testDb.db
        .insert(versionPolicy)
        .values({ platform: 'ios', version: '2.0.0', isBreaking: true, state: 'live' });
      const service = createService();

      const result = await service.getRequiredUpdate({
        'x-app-platform': 'ios',
        'x-app-version': '1.0.0',
      });

      expect(result).toEqual({ minVersion: '2.0.0' });
    });

    it('lets a supported app through', async () => {
      const service = createService();

      const result = await service.getRequiredUpdate({
        'x-app-platform': 'ios',
        'x-app-version': '1.6.0',
      });

      expect(result).toBeNull();
    });

    it('ignores requests without app headers', async () => {
      const service = createService();

      const result = await service.getRequiredUpdate({});

      expect(result).toBeNull();
    });
  });

  describe('updateVersionPolicy', () => {
    it('records the release as pending and does not move getStatus yet', async () => {
      const service = createService();

      await service.updateVersionPolicy('ios', '1.7.0', false);

      const result = await service.getStatus({ platform: 'ios', version: '1.6.0' });
      expect(result.version).toEqual({
        status: 'up_to_date',
        minVersion: '1.0.0',
        latestVersion: '1.0.0',
      });
    });

    it('triggers the store-release watch with the right platform/version', async () => {
      const prefect = new FakePrefectService();
      const service = createService(prefect);

      await service.updateVersionPolicy('ios', '1.7.0', false);

      expect(prefect.calls).toEqual([{ platform: 'ios', version: '1.7.0' }]);
    });

    it('is a no-op the second time the same (platform, version) is reported', async () => {
      const prefect = new FakePrefectService();
      const service = createService(prefect);

      await service.updateVersionPolicy('ios', '1.7.0', false);
      await service.updateVersionPolicy('ios', '1.7.0', false);

      expect(prefect.calls.length).toBe(1);
    });

    it('rolls back the pending row when triggering the watch fails', async () => {
      const prefect = new FakePrefectService();
      prefect.shouldFail = true;
      const service = createService(prefect);

      await expect(service.updateVersionPolicy('ios', '1.7.0', false)).rejects.toThrow();

      const [row] = await testDb.db
        .select()
        .from(versionPolicy)
        .where(and(eq(versionPolicy.platform, 'ios'), eq(versionPolicy.version, '1.7.0')));
      expect(row).toBeUndefined();
    });
  });

  describe('getVersionReleaseState', () => {
    it('returns null for a (platform, version) that was never reported', async () => {
      const service = createService();

      const result = await service.getVersionReleaseState('ios', '9.9.9');

      expect(result).toBeNull();
    });

    it('returns pending for a freshly reported release', async () => {
      const service = createService();
      await service.updateVersionPolicy('ios', '1.7.0', false);

      const result = await service.getVersionReleaseState('ios', '1.7.0');

      expect(result?.state).toBe('pending');
    });

    it('returns live once confirmed', async () => {
      const service = createService();
      await service.updateVersionPolicy('ios', '1.7.0', false);
      await service.confirmVersionLive('ios', '1.7.0');

      const result = await service.getVersionReleaseState('ios', '1.7.0');

      expect(result?.state).toBe('live');
    });

    it('returns superseded once a later version of the same platform is live', async () => {
      const service = createService();
      await service.updateVersionPolicy('ios', '1.7.0', false); // pending, never confirmed
      await service.updateVersionPolicy('ios', '1.8.0', false);
      await service.confirmVersionLive('ios', '1.8.0');

      const result = await service.getVersionReleaseState('ios', '1.7.0');

      expect(result?.state).toBe('superseded');
    });

    it('does not consider a different platform when checking for supersession', async () => {
      const service = createService();
      await service.updateVersionPolicy('ios', '1.7.0', false);
      await service.updateVersionPolicy('android', '1.8.0', false);
      await service.confirmVersionLive('android', '1.8.0');

      const result = await service.getVersionReleaseState('ios', '1.7.0');

      expect(result?.state).toBe('pending');
    });
  });

  describe('confirmVersionLive', () => {
    it('moves getStatus once confirmed', async () => {
      const service = createService();
      await service.updateVersionPolicy('ios', '1.7.0', false);

      await service.confirmVersionLive('ios', '1.7.0');
      const result = await service.getStatus({ platform: 'ios', version: '1.6.0' });

      expect(result.version).toEqual({
        status: 'update_available',
        minVersion: '1.0.0',
        latestVersion: '1.7.0',
      });
    });

    it('takes effect immediately, bypassing the cache TTL', async () => {
      const service = createService();
      await service.updateVersionPolicy('ios', '1.7.0', false);

      await service.getStatus({ platform: 'ios', version: '1.6.0' }); // warms the cache
      await service.confirmVersionLive('ios', '1.7.0');
      const result = await service.getStatus({ platform: 'ios', version: '1.6.0' });

      expect(result.version.latestVersion).toBe('1.7.0');
    });
  });
});
