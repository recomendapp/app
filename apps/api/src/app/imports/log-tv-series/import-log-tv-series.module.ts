import { Module } from '@nestjs/common';
import { ImportLogTvSeriesController } from './import-log-tv-series.controller';
import { ImportLogTvSeriesService } from './import-log-tv-series.service';
import { ImportLogTvSeriesReviewsModule } from './reviews/import-log-tv-series-reviews.module';

@Module({
  imports: [ImportLogTvSeriesReviewsModule],
  controllers: [ImportLogTvSeriesController],
  providers: [ImportLogTvSeriesService],
})
export class ImportLogTvSeriesModule {}
