import { Module } from '@nestjs/common';
import { ImportLogTvSeriesReviewsController } from './import-log-tv-series-reviews.controller';
import { ImportLogTvSeriesReviewsService } from './import-log-tv-series-reviews.service';

@Module({
  controllers: [ImportLogTvSeriesReviewsController],
  providers: [ImportLogTvSeriesReviewsService],
})
export class ImportLogTvSeriesReviewsModule {}
