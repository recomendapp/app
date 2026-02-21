import { Module } from '@nestjs/common';
import { TvSeriesPlaylistsService } from './tv-series-playlists.service';
import { TvSeriesPlaylistsController } from './tv-series-playlists.controller';

@Module({
  controllers: [TvSeriesPlaylistsController],
  providers: [TvSeriesPlaylistsService],
  exports: [TvSeriesPlaylistsService],
})
export class TvSeriesPlaylistsModule {}