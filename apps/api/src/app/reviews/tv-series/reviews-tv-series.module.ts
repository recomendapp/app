import { Module } from '@nestjs/common';
import { ReviewsTvSeriesService } from './reviews-tv-series.service';
import { ReviewsTvSeriesController } from './reviews-tv-series.controller';
import { SharedWorkerModule } from '@shared/worker';

@Module({
  imports: [
    SharedWorkerModule,
  ],
  controllers: [ReviewsTvSeriesController],
  providers: [ReviewsTvSeriesService],
  exports: [ReviewsTvSeriesService],
})
export class ReviewsTvSeriesModule {}