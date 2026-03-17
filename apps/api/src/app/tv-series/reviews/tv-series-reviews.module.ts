import { Module } from '@nestjs/common';
import { TvSeriesReviewsService } from './tv-series-reviews.service';
import { TvSeriesReviewsController } from './tv-series-reviews.controller';

@Module({
  controllers: [TvSeriesReviewsController],
  providers: [TvSeriesReviewsService],
  exports: [TvSeriesReviewsService],
})
export class TvSeriesReviewsModule {}