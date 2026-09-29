import { describe, it, expect } from 'bun:test';
import { systemConfig, versionPolicy } from '@libs/db/schemas';
import { SystemService } from './system.service';
import type { DrizzleService } from '../../common/modules/drizzle/drizzle.module';
import type { CacheService } from '../../common/modules/cache/cache.service';
import type { PrefectService } from '../../common/modules/prefect/prefect.service';

const policyRows = [{ platform: 'ios', version: '1.0.0', isBreaking: false, state: 'live' }];
const configRows = [{ key: 'is_maintenance', value: false }];

/** Counts how many times the DB is actually queried, independent of Redis/L1. */
const fakeDb = (calls: { count: number }) =>
  ({
    select: () => ({
      from: (table: unknown) => {
        calls.count++;
        if (table === versionPolicy) return { where: async () => policyRows };
        if (table === systemConfig) return { where: async () => configRows };
        throw new Error('Unexpected table passed to fakeDb.select().from()');
      },
    }),
  }) as unknown as DrizzleService;

const fakeCache = (calls: { count: number }) =>
  ({
    get: async () => {
      calls.count++;
      return null; // always a Redis miss, so every call would reach the DB without L1/dedup
    },
    set: async () => undefined,
    del: async () => undefined,
  }) as unknown as CacheService;

const fakePrefect = {} as unknown as PrefectService;

describe('SystemService (L1 cache)', () => {
  it('serves back-to-back calls from L1 without touching Redis or the DB again', async () => {
    const cacheCalls = { count: 0 };
    const dbCalls = { count: 0 };
    const service = new SystemService(fakeDb(dbCalls), fakeCache(cacheCalls), fakePrefect);

    await service.getStatus(null);
    await service.getStatus(null);
    await service.getStatus(null);

    expect(cacheCalls.count).toBe(1);
    expect(dbCalls.count).toBe(2); // one select for systemConfig, one for versionPolicy
  });

  it('dedupes concurrent calls into a single Redis/DB round trip', async () => {
    const cacheCalls = { count: 0 };
    const dbCalls = { count: 0 };
    const service = new SystemService(fakeDb(dbCalls), fakeCache(cacheCalls), fakePrefect);

    await Promise.all([
      service.getStatus(null),
      service.getStatus(null),
      service.getStatus(null),
      service.getRequiredUpdate({ 'x-app-platform': 'ios', 'x-app-version': '0.9.0' }),
    ]);

    expect(cacheCalls.count).toBe(1);
    expect(dbCalls.count).toBe(2);
  });

  it('worst case (L1 miss) still resolves correctly, matching the no-L1 behavior', async () => {
    const cacheCalls = { count: 0 };
    const dbCalls = { count: 0 };
    const service = new SystemService(fakeDb(dbCalls), fakeCache(cacheCalls), fakePrefect);

    const result = await service.getStatus({ platform: 'ios', version: '0.9.0' });

    expect(result.version).toEqual({
      status: 'update_available',
      minVersion: null,
      latestVersion: '1.0.0',
    });
  });
});
