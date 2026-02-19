import { Module } from '@nestjs/common';
import { TvSeriesController } from './tv-series.controller';
import { TvSeriesService } from './tv-series.service';
import { TvSeasonsModule } from './seasons/tv-seasons.module';
import { TvSeriesBookmarkModule } from './bookmark/tv-series-bookmark.module';

@Module({
  imports: [
    TvSeasonsModule,
    // TvSeriesLogModule,
    TvSeriesBookmarkModule,
  ],
  controllers: [TvSeriesController],
  providers: [TvSeriesService],
  exports: [TvSeriesService],
})
export class TvSeriesModule {}
