import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { CACHE_SERVICE } from './cache.constants';

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);

  constructor(
    @Inject(CACHE_SERVICE) private readonly redis: Redis,
  ) {}

  // Without this, the ioredis connection stays open and Node never exits on its own —
  // fine for a long-running server, but it hangs any one-shot script that calls app.close()
  // (e.g. apps/api/scripts/generate-openapi.ts).
  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }

  /** Returns the cached value, or null on a miss (or if Redis is unavailable). */
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.redis.get(key);
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch (error) {
      this.logger.warn(`Failed to read cache key "${key}"`, error);
      return null;
    }
  }

  /** Best-effort write; a cache failure must never break the request it's caching. */
  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (error) {
      this.logger.warn(`Failed to write cache key "${key}"`, error);
    }
  }

  async del(key: string | string[]): Promise<void> {
    try {
      const keys = Array.isArray(key) ? key : [key];
      if (keys.length > 0) await this.redis.del(keys);
    } catch (error) {
      this.logger.warn(`Failed to delete cache key(s) "${key}"`, error);
    }
  }
}
