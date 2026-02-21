import { Module } from '@nestjs/common';
import { TvSeriesController } from './tv-series.controller';
import { TvSeriesService } from './tv-series.service';
import { TvSeasonsModule } from './seasons/tv-seasons.module';
import { TvSeriesBookmarksModule } from './bookmark/tv-series-bookmarks.module';
import { TvSeriesPlaylistsModule } from './playlists/tv-series-playlists.module';

@Module({
  imports: [
    TvSeasonsModule,
    // TvSeriesLogModule,
    TvSeriesPlaylistsModule,
    TvSeriesBookmarksModule,
  ],
  controllers: [TvSeriesController],
  providers: [TvSeriesService],
  exports: [TvSeriesService],
})
export class TvSeriesModule {}
