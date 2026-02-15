import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SEARCH_QUEUE } from './shared-worker.constants';
import { WorkerClient } from './shared-worker.client';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: SEARCH_QUEUE },
    ),
  ],
  providers: [
    WorkerClient,
  ],
  exports: [
    WorkerClient,
  ],
})
export class SharedWorkerModule {}
