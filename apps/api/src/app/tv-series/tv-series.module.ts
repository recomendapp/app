import { Module } from '@nestjs/common';
import { TvSeriesController } from './tv-series.controller';
import { TvSeriesService } from './tv-series.service';
import { TvSeasonsModule } from './seasons/tv-seasons.module';

@Module({
  imports: [
    TvSeasonsModule,
    // TvSeriesLogModule
  ],
  controllers: [TvSeriesController],
  providers: [TvSeriesService],
  exports: [TvSeriesService],
})
export class TvSeriesModule {}
