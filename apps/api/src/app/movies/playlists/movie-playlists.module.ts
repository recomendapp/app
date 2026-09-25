import { Module } from '@nestjs/common';
import { MoviePlaylistsService } from './movie-playlists.service';
import { MoviePlaylistsController } from './movie-playlists.controller';
import { MoviePlaylistsTool } from './movie-playlists.tool';

@Module({
  controllers: [MoviePlaylistsController, MoviePlaylistsTool],
  providers: [MoviePlaylistsService],
  exports: [MoviePlaylistsService],
})
export class MoviePlaylistsModule {}
