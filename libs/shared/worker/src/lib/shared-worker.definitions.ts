import { Job } from 'bullmq';
import { SearchRegistry } from './search/search.registry';

export type WorkerRegistry = SearchRegistry;

export type WorkerJobName = keyof WorkerRegistry;

type DistributiveJob<K extends WorkerJobName> = K extends any
  ? Job<WorkerRegistry[K], any, K>
  : never;

export type WorkerJob = DistributiveJob<WorkerJobName>;