import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { FEED_QUEUE, FeedJob } from '@shared/worker';
import { FeedService } from './feed.service';

@Processor(FEED_QUEUE)
export class FeedProcessor extends WorkerHost {
  private readonly logger = new Logger(FeedProcessor.name);

  constructor(private readonly feedService: FeedService) {
    super();
  }

  async process(job: FeedJob): Promise<void> {
    this.logger.log(`Processing job ${job.name} (ID: ${job.id})`);

    try {
      switch (job.name) {
        case 'feed:insert-activity':
          await this.feedService.insertActivity(job.data);
          break;
        
        case 'feed:delete-activity':
          await this.feedService.deleteActivity(job.data);
          break;

        default:
          this.logger.warn(`Unhandled job`);
      }
    } catch (error) {
      this.logger.error(`Failed to process ${job.name}`, error);
      throw error; 
    }
  }
}