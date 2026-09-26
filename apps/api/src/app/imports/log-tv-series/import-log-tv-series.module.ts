import { Module } from '@nestjs/common';
import { ImportLogTvSeriesController } from './import-log-tv-series.controller';
import { ImportLogTvSeriesTool } from './import-log-tv-series.tool';
import { ImportLogTvSeriesService } from './import-log-tv-series.service';
import { ImportLogTvSeriesReviewsModule } from './reviews/import-log-tv-series-reviews.module';

@Module({
  imports: [ImportLogTvSeriesReviewsModule],
  controllers: [ImportLogTvSeriesController, ImportLogTvSeriesTool],
  providers: [ImportLogTvSeriesService],
})
export class ImportLogTvSeriesModule {}
