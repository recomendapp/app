import { Job } from 'bullmq';
import { MailerAuthRegistry } from './auth/auth.registry';

export type MailerRegistry = MailerAuthRegistry;

export type MailerJobName = keyof MailerRegistry;

type DistributiveJob<K extends MailerJobName> = K extends any
  ? Job<MailerRegistry[K], any, K>
  : never;

export type MailerJob = DistributiveJob<MailerJobName>;