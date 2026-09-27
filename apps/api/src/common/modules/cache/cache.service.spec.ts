import { describe, it, expect, mock } from 'bun:test';
import type { Mocked } from '@libs/testing';
import type Redis from 'ioredis';
import { CacheService } from './cache.service';

describe('CacheService', () => {
  function fakeRedis(overrides?: Partial<Redis>) {
    return {
      get: mock(),
      set: mock(),
      del: mock(),
      quit: mock(),
      ...overrides,
    } as unknown as Mocked<Redis>;
  }

  describe('get', () => {
    it('returns null on a cache miss', async () => {
      const redis = fakeRedis({ get: mock().mockResolvedValue(null) });
      const service = new CacheService(redis);

      expect(await service.get('key')).toBeNull();
    });

    it('parses and returns the cached JSON value', async () => {
      const redis = fakeRedis({ get: mock().mockResolvedValue(JSON.stringify({ a: 1 })) });
      const service = new CacheService(redis);

      expect(await service.get<{ a: number }>('key')).toEqual({ a: 1 });
    });

    it('returns null (not a throw) when redis itself fails', async () => {
      const redis = fakeRedis({ get: mock().mockRejectedValue(new Error('redis down')) });
      const service = new CacheService(redis);

      await expect(service.get('key')).resolves.toBeNull();
    });

    it('returns null (not a throw) when the cached value is not valid JSON', async () => {
      const redis = fakeRedis({ get: mock().mockResolvedValue('{not valid json') });
      const service = new CacheService(redis);

      await expect(service.get('key')).resolves.toBeNull();
    });
  });

  describe('set', () => {
    it('serializes the value and sets it with the given TTL', async () => {
      const redis = fakeRedis();
      const service = new CacheService(redis);

      await service.set('key', { a: 1 }, 60);

      expect(redis.set).toHaveBeenCalledWith('key', JSON.stringify({ a: 1 }), 'EX', 60);
    });

    it('never throws when redis fails (best-effort write)', async () => {
      const redis = fakeRedis({ set: mock().mockRejectedValue(new Error('redis down')) });
      const service = new CacheService(redis);

      await expect(service.set('key', 'value', 60)).resolves.toBeUndefined();
    });
  });

  describe('del', () => {
    it('deletes a single key by wrapping it in an array', async () => {
      const redis = fakeRedis();
      const service = new CacheService(redis);

      await service.del('key');

      expect(redis.del).toHaveBeenCalledWith(['key']);
    });

    it('deletes multiple keys as given', async () => {
      const redis = fakeRedis();
      const service = new CacheService(redis);

      await service.del(['a', 'b']);

      expect(redis.del).toHaveBeenCalledWith(['a', 'b']);
    });

    it('skips the redis call entirely for an empty array', async () => {
      const redis = fakeRedis();
      const service = new CacheService(redis);

      await service.del([]);

      expect(redis.del).not.toHaveBeenCalled();
    });

    it('never throws when redis fails', async () => {
      const redis = fakeRedis({ del: mock().mockRejectedValue(new Error('redis down')) });
      const service = new CacheService(redis);

      await expect(service.del('key')).resolves.toBeUndefined();
    });
  });

  describe('onModuleDestroy', () => {
    it('quits the redis connection', async () => {
      const redis = fakeRedis();
      const service = new CacheService(redis);

      await service.onModuleDestroy();

      expect(redis.quit).toHaveBeenCalled();
    });
  });
});
