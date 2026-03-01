import { Job } from 'bullmq';
import { NotifyAuthRegistry } from './auth/auth.registry';
import { NotifyRecoRegistry } from './reco/reco.registry';
import { NotifyFollowRegistry } from './follow/follow.registry';

export type NotifyRegistry =
  NotifyAuthRegistry
  & NotifyRecoRegistry 
  & NotifyFollowRegistry;

export type NotifyJobName = keyof NotifyRegistry;

type DistributiveJob<K extends NotifyJobName> = K extends any
  ? Job<NotifyRegistry[K], any, K>
  : never;

export type NotifyJob = DistributiveJob<NotifyJobName>;