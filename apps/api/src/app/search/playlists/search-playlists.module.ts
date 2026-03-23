import { Module } from '@nestjs/common';
import { SearchPlaylistsController } from './search-playlists.controller';
import { SearchPlaylistsService } from './search-playlists.service';

@Module({
  controllers: [SearchPlaylistsController],
  providers: [SearchPlaylistsService],
  exports: [SearchPlaylistsService],
})
export class SearchPlaylistsModule {}
