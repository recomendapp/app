import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { SharedWorkerModule } from '@shared/worker';
import { env } from '../env';
import { DrizzleModule } from '../common/modules/drizzle.module';
import { SearchModule } from './search/search.module';
import { StoreReleaseModule } from './store-release/store-release.module';
import { EnvModule, workerSchema } from '@libs/env';

@Module({
  imports: [
    EnvModule.forRoot(workerSchema),
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      connection: {
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        password: env.REDIS_PASSWORD,
      },
    }),
    DrizzleModule,
    SharedWorkerModule,
    SearchModule,
    StoreReleaseModule,
  ],
})
export class WorkerModule {}
