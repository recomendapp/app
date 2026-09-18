import type { CallHandler, ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { of } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import type { CacheService } from '../modules/cache/cache.service';
import { HttpCacheInterceptor } from './http-cache.interceptor';
import {
  CACHEABLE_PREFIX_METADATA,
  CACHEABLE_TTL_METADATA,
} from '../decorators/cacheable.constants';

describe('HttpCacheInterceptor', () => {
  function fakeCacheService(overrides?: Partial<jest.Mocked<CacheService>>) {
    return {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn(),
      ...overrides,
    } as unknown as jest.Mocked<CacheService>;
  }

  function fakeReflector(metadata: { prefix?: string; ttl?: number }): Reflector {
    return {
      get: jest.fn((key: string) => {
        if (key === CACHEABLE_PREFIX_METADATA) return metadata.prefix;
        if (key === CACHEABLE_TTL_METADATA) return metadata.ttl;
        return undefined;
      }),
    } as unknown as Reflector;
  }

  function contextFor(
    method: string,
    url: string,
    headers: Record<string, string> = {},
  ): ExecutionContext {
    return {
      switchToHttp: () => ({ getRequest: () => ({ method, url, headers }) }),
      getHandler: () => jest.fn(),
    } as unknown as ExecutionContext;
  }

  function handlerReturning(value: unknown): CallHandler {
    return { handle: () => of(value) };
  }

  it('bypasses caching entirely for non-GET requests', async () => {
    const cache = fakeCacheService();
    const interceptor = new HttpCacheInterceptor(cache, fakeReflector({ prefix: 'p', ttl: 60 }));
    const handler = handlerReturning({ ok: true });

    const result$ = await interceptor.intercept(contextFor('POST', '/x'), handler);
    await firstValueFrom(result$);

    expect(cache.get).not.toHaveBeenCalled();
  });

  it('bypasses caching when the route has no @Cacheable metadata', async () => {
    const cache = fakeCacheService();
    const interceptor = new HttpCacheInterceptor(cache, fakeReflector({}));
    const handler = handlerReturning({ ok: true });

    const result$ = await interceptor.intercept(contextFor('GET', '/x'), handler);
    await firstValueFrom(result$);

    expect(cache.get).not.toHaveBeenCalled();
  });

  it('bypasses caching when only the prefix is set but not the ttl', async () => {
    const cache = fakeCacheService();
    const interceptor = new HttpCacheInterceptor(cache, fakeReflector({ prefix: 'p' }));
    const handler = handlerReturning({ ok: true });

    await firstValueFrom(await interceptor.intercept(contextFor('GET', '/x'), handler));

    expect(cache.get).not.toHaveBeenCalled();
  });

  it('returns the cached value directly on a cache hit, without calling the handler', async () => {
    const cache = fakeCacheService({ get: jest.fn().mockResolvedValue({ cached: true }) });
    const interceptor = new HttpCacheInterceptor(cache, fakeReflector({ prefix: 'p', ttl: 60 }));
    const handle = jest.fn().mockReturnValue(of({ fresh: true }));

    const result = await firstValueFrom(
      await interceptor.intercept(contextFor('GET', '/x'), { handle }),
    );

    expect(result).toEqual({ cached: true });
    expect(handle).not.toHaveBeenCalled();
  });

  it('calls the handler and writes the response to the cache on a miss', async () => {
    const cache = fakeCacheService();
    const interceptor = new HttpCacheInterceptor(cache, fakeReflector({ prefix: 'p', ttl: 60 }));
    const handler = handlerReturning({ fresh: true });

    const result = await firstValueFrom(
      await interceptor.intercept(contextFor('GET', '/x'), handler),
    );

    expect(result).toEqual({ fresh: true });
    expect(cache.set).toHaveBeenCalledWith(expect.any(String), { fresh: true }, 60);
  });

  it('builds the same cache key regardless of query parameter order', async () => {
    const cache = fakeCacheService();
    const interceptor = new HttpCacheInterceptor(cache, fakeReflector({ prefix: 'p', ttl: 60 }));
    const handler = handlerReturning({});

    await firstValueFrom(await interceptor.intercept(contextFor('GET', '/x?b=2&a=1'), handler));
    const firstKey = cache.set.mock.calls[0][0];

    await firstValueFrom(await interceptor.intercept(contextFor('GET', '/x?a=1&b=2'), handler));
    const secondKey = cache.set.mock.calls[1][0];

    expect(firstKey).toBe(secondKey);
  });

  it('scopes the cache key by locale, so different locales never collide', async () => {
    const cache = fakeCacheService();
    const interceptor = new HttpCacheInterceptor(cache, fakeReflector({ prefix: 'p', ttl: 60 }));
    const handler = handlerReturning({});

    await firstValueFrom(
      await interceptor.intercept(contextFor('GET', '/x', { 'x-language': 'fr-FR' }), handler),
    );
    const frKey = cache.set.mock.calls[0][0];

    await firstValueFrom(
      await interceptor.intercept(contextFor('GET', '/x', { 'x-language': 'en-US' }), handler),
    );
    const enKey = cache.set.mock.calls[1][0];

    expect(frKey).not.toBe(enKey);
  });
});
