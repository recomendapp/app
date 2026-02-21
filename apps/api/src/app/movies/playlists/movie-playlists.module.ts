import { Module } from '@nestjs/common';
import { MoviePlaylistsService } from './movie-playlists.service';
import { MoviePlaylistsController } from './movie-playlists.controller';

@Module({
  controllers: [MoviePlaylistsController],
  providers: [MoviePlaylistsService],
  exports: [MoviePlaylistsService],
})
export class MoviePlaylistsModule {}