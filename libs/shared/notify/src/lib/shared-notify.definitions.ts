import { Job } from 'bullmq';
import {
  NotifyAuthRegistry,
  NotifyFollowRegistry,
  NotifyRecoRegistry,
} from '@libs/notify-types';

export type NotifyRegistry =
  NotifyAuthRegistry
  & NotifyRecoRegistry 
  & NotifyFollowRegistry;

export type NotifyJobName = keyof NotifyRegistry;

type DistributiveJob<K extends NotifyJobName> = K extends any
  ? Job<NotifyRegistry[K], any, K>
  : never;

export type NotifyJob = DistributiveJob<NotifyJobName>;