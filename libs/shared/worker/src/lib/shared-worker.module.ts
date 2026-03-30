import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WorkerClient } from './shared-worker.client';
import { SEARCH_QUEUE } from './search/search.registry';
import { COUNTERS_QUEUE } from './counters/counters.registry';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: SEARCH_QUEUE },
      { name: COUNTERS_QUEUE },
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
