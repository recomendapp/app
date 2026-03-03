import { Job } from 'bullmq';
import { SearchRegistry } from './search/search.registry';
import { CountersRegistry } from './counters/counters.registry';

export type WorkerRegistry = SearchRegistry & CountersRegistry;

export type WorkerJobName = keyof WorkerRegistry;

type DistributiveJob<K extends WorkerJobName> = K extends any
  ? Job<WorkerRegistry[K], any, K>
  : never;

export type WorkerJob = DistributiveJob<WorkerJobName>;

export type SearchJobName = keyof SearchRegistry;
export type SearchJob = DistributiveJob<SearchJobName>;

export type CountersJobName = keyof CountersRegistry;
export type CountersJob = DistributiveJob<CountersJobName>;