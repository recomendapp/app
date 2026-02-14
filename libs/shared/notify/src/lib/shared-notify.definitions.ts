import { Job } from 'bullmq';
import { NotifyAuthRegistry } from './auth/auth.registry';

export type NotifyRegistry = NotifyAuthRegistry;

export type NotifyJobName = keyof NotifyRegistry;

type DistributiveJob<K extends NotifyJobName> = K extends any
  ? Job<NotifyRegistry[K], any, K>
  : never;

export type NotifyJob = DistributiveJob<NotifyJobName>;