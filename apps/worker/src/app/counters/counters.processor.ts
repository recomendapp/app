import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { COUNTERS_QUEUE, CountersJob } from '@shared/worker';
import { CountersService } from './counters.service';

@Processor(COUNTERS_QUEUE)
export class CountersProcessor extends WorkerHost {
  private readonly logger = new Logger(CountersProcessor.name);

  constructor(private readonly countersService: CountersService) {
    super();
  }

  async process(job: CountersJob): Promise<void> {
    this.logger.log(`Processing job ${job.name} (ID: ${job.id})`);

    try {
      switch (job.name) {
        case 'counters:update-follow':
          await this.countersService.updateFollowCounts(job.data);
          break;

        case 'counters:update-review-movie-likes':
          await this.countersService.updateReviewMovieLikes(job.data);
          break;

        case 'counters:update-review-tv-series-likes':
          await this.countersService.updateReviewTvSeriesLikes(job.data);
          break;
        
        case 'counters:update-playlist-likes':
          await this.countersService.updatePlaylistLikes(job.data);
          break;
        
        case 'counters:update-playlist-saves':
          await this.countersService.updatePlaylistSaves(job.data);
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