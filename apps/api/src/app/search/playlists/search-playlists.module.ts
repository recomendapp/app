import { Module } from '@nestjs/common';
import { SearchPlaylistsController } from './search-playlists.controller';
import { SearchPlaylistsService } from './search-playlists.service';
import { SearchPlaylistsTool } from './search-playlists.tool';

@Module({
  controllers: [SearchPlaylistsController, SearchPlaylistsTool],
  providers: [SearchPlaylistsService],
  exports: [SearchPlaylistsService],
})
export class SearchPlaylistsModule {}
