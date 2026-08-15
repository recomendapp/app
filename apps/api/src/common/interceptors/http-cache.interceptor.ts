import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { getLocaleFromHeaders } from '@libs/i18n';
import { CacheService } from '../modules/cache/cache.service';
import {
  CACHEABLE_PREFIX_METADATA,
  CACHEABLE_TTL_METADATA,
} from '../decorators/cacheable.constants';

@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest();

    if (request.method !== 'GET') {
      return next.handle();
    }

    const prefix = this.reflector.get<string>(CACHEABLE_PREFIX_METADATA, context.getHandler());
    const ttlSeconds = this.reflector.get<number>(CACHEABLE_TTL_METADATA, context.getHandler());

    if (!prefix || !ttlSeconds) {
      return next.handle();
    }

    const locale = getLocaleFromHeaders(request.headers);
    const key = this.buildCacheKey(prefix, request.url, locale);

    const cached = await this.cacheService.get(key);
    if (cached !== null) {
      return of(cached);
    }

    return next.handle().pipe(
      tap((response) => {
        void this.cacheService.set(key, response, ttlSeconds);
      }),
    );
  }

  /** Canonicalizes the query string (order-independent) so equivalent requests share one cache entry. */
  private buildCacheKey(prefix: string, url: string, locale: string): string {
    const [pathname, query = ''] = url.split('?');
    const sortedEntries = [...new URLSearchParams(query).entries()].sort(([a], [b]) =>
      a.localeCompare(b),
    );
    const sortedQuery = new URLSearchParams(sortedEntries).toString();
    return `${prefix}:${pathname}${sortedQuery ? `?${sortedQuery}` : ''}:${locale}`;
  }
}
