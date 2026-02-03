import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue, JobsOptions } from 'bullmq';
import { MAILER_QUEUE } from './shared-mailer.constants';
import { MailerJobName, MailerRegistry } from './shared-mailer.definitions';

@Injectable()
export class MailerClient {
    constructor(@InjectQueue(MAILER_QUEUE) private readonly queue: Queue) {}

    /**
     * @param jobName
     * @param data
     * @param options
     */
    async emit<K extends MailerJobName>(
        jobName: K, 
        data: MailerRegistry[K],
        options?: JobsOptions,
    ) {
        const defaultOptions: JobsOptions = {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 1000,
            },
            removeOnComplete: true,
            removeOnFail: false,
        };
        await this.queue.add(jobName, data, { ...defaultOptions, ...options });
    }
}