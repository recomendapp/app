import { applyDecorators, SetMetadata, UseInterceptors } from '@nestjs/common';
import { HttpCacheInterceptor } from '../interceptors/http-cache.interceptor';
import { CACHEABLE_PREFIX_METADATA, CACHEABLE_TTL_METADATA } from './cacheable.constants';

/**
 * Caches a GET route's response in Redis for `ttlSeconds`, keyed by route path + query (order-independent) + locale.
 * Only apply to routes whose response doesn't vary per authenticated user.
 */
export function Cacheable(prefix: string, ttlSeconds: number) {
  return applyDecorators(
    SetMetadata(CACHEABLE_PREFIX_METADATA, prefix),
    SetMetadata(CACHEABLE_TTL_METADATA, ttlSeconds),
    UseInterceptors(HttpCacheInterceptor),
  );
}
