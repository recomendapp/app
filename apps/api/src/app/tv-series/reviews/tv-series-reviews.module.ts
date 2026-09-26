import { Module } from '@nestjs/common';
import { TvSeriesReviewsService } from './tv-series-reviews.service';
import { TvSeriesReviewsController } from './tv-series-reviews.controller';
import { TvSeriesReviewsTool } from './tv-series-reviews.tool';

@Module({
  controllers: [TvSeriesReviewsController, TvSeriesReviewsTool],
  providers: [TvSeriesReviewsService],
  exports: [TvSeriesReviewsService],
})
export class TvSeriesReviewsModule {}
