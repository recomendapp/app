import { Module } from '@nestjs/common';
import { ImportLogTvSeriesReviewsController } from './import-log-tv-series-reviews.controller';
import { ImportLogTvSeriesReviewsTool } from './import-log-tv-series-reviews.tool';
import { ImportLogTvSeriesReviewsService } from './import-log-tv-series-reviews.service';

@Module({
  controllers: [ImportLogTvSeriesReviewsController, ImportLogTvSeriesReviewsTool],
  providers: [ImportLogTvSeriesReviewsService],
})
export class ImportLogTvSeriesReviewsModule {}
