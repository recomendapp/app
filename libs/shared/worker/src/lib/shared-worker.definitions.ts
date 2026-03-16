import { Job } from 'bullmq';
import { SearchRegistry, SearchSchemas } from './search/search.registry';
import { CountersRegistry, CountersSchemas } from './counters/counters.registry';
import { FeedRegistry, FeedSchemas } from './feed/feed.registry';

export type WorkerRegistry =
  SearchRegistry
  & CountersRegistry
  & FeedRegistry;

export type WorkerJobName = keyof WorkerRegistry;

export const WorkerSchemas = {
  ...SearchSchemas,
  ...CountersSchemas,
  ...FeedSchemas,
} as const;

type DistributiveJob<K extends WorkerJobName> = K extends any
  ? Job<WorkerRegistry[K], any, K>
  : never;

export type WorkerJob = DistributiveJob<WorkerJobName>;

export type SearchJobName = keyof SearchRegistry;
export type SearchJob = DistributiveJob<SearchJobName>;

export type CountersJobName = keyof CountersRegistry;
export type CountersJob = DistributiveJob<CountersJobName>;

export type FeedJobName = keyof FeedRegistry;
export type FeedJob = DistributiveJob<FeedJobName>;