import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue, JobsOptions } from 'bullmq';
import { SEARCH_QUEUE } from './shared-worker.constants';
import { WorkerJobName, WorkerRegistry } from './shared-worker.definitions';

@Injectable()
export class WorkerClient {
    private readonly logger = new Logger(WorkerClient.name);
    constructor(
        @InjectQueue(SEARCH_QUEUE) private readonly searchQueue: Queue,
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
        switch (jobName.split(':')[0]) {
            case 'search': {
                targetQueue = this.searchQueue;
                break;
            }
            default: {
                this.logger.error(`Unknown job name: ${jobName}`);
                throw new Error(`Unknown job name: ${jobName}`);
            }
        }

        await targetQueue.add(jobName, data, { ...defaultOptions, ...options });
    }
}