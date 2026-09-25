import { Module } from '@nestjs/common';
import { TvSeriesPlaylistsService } from './tv-series-playlists.service';
import { TvSeriesPlaylistsController } from './tv-series-playlists.controller';
import { TvSeriesPlaylistsTool } from './tv-series-playlists.tool';

@Module({
  controllers: [TvSeriesPlaylistsController, TvSeriesPlaylistsTool],
  providers: [TvSeriesPlaylistsService],
  exports: [TvSeriesPlaylistsService],
})
export class TvSeriesPlaylistsModule {}
