import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue, JobsOptions } from 'bullmq';
import { WorkerJobName, WorkerRegistry } from './shared-worker.definitions';
import { SEARCH_PATH, SEARCH_QUEUE } from './search/search.registry';
import { COUNTERS_PATH, COUNTERS_QUEUE } from './counters/counters.registry';

@Injectable()
export class WorkerClient {
    private readonly logger = new Logger(WorkerClient.name);
    constructor(
        @InjectQueue(SEARCH_QUEUE) private readonly searchQueue: Queue,
        @InjectQueue(COUNTERS_QUEUE) private readonly countersQueue: Queue,
    ) {}

    /**
     * @param jobName
     * @param data
     * @param options
     */
    async emit<K extends WorkerJobName>(
        jobName: K, 
        data: WorkerRegistry[K],
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

        let targetQueue: Queue;

        const jobPrefix = jobName.split(':')[0];

        switch (jobPrefix) {
            case SEARCH_PATH: {
                targetQueue = this.searchQueue;
                break;
            }
            case COUNTERS_PATH: {
                targetQueue = this.countersQueue;
                break;
            }
            default: {
                this.logger.error(`Unknown job prefix: ${jobPrefix} for job ${jobName}`);
                throw new Error(`Unknown job prefix: ${jobPrefix}`);
            }
        }

        await targetQueue.add(jobName, data, { ...defaultOptions, ...options });
    }
}