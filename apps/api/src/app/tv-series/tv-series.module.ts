import { Module } from '@nestjs/common';
import { TvSeriesController } from './tv-series.controller';
import { TvSeriesService } from './tv-series.service';
import { TvSeasonsModule } from './seasons/tv-seasons.module';
import { TvSeriesPlaylistsModule } from './playlists/tv-series-playlists.module';
import { TvSeriesLogsModule } from './logs/tv-series-logs.module';
import { TvSeriesReviewsModule } from './reviews/tv-series-reviews.module';
import { TvSeriesImagesModule } from './images/tv-series-images.module';

@Module({
  imports: [
    TvSeasonsModule,
    TvSeriesLogsModule,
    TvSeriesPlaylistsModule,
    TvSeriesReviewsModule,
    TvSeriesImagesModule,
  ],
  controllers: [TvSeriesController],
  providers: [TvSeriesService],
  exports: [TvSeriesService],
})
export class TvSeriesModule {}
