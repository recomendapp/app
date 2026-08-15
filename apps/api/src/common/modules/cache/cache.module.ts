import { Global, Module } from '@nestjs/common';
import Redis from 'ioredis';
import { CacheService } from './cache.service';
import { CACHE_SERVICE } from './cache.constants';
import { env } from '../../../env';

@Global()
@Module({
  providers: [
    {
      provide: CACHE_SERVICE,
      useFactory: () => new Redis({
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        password: env.REDIS_PASSWORD,
      }),
    },
    CacheService,
  ],
  exports: [CacheService],
})
export class CacheModule {}
