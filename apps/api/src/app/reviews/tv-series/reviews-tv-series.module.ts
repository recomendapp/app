import { Module } from '@nestjs/common';
import { ReviewsTvSeriesService } from './reviews-tv-series.service';
import { ReviewsTvSeriesController } from './reviews-tv-series.controller';

@Module({
  controllers: [ReviewsTvSeriesController],
  providers: [ReviewsTvSeriesService],
  exports: [ReviewsTvSeriesService],
})
export class ReviewsTvSeriesModule {}