import { Module } from '@nestjs/common';
import { ImportPlaylistsController } from './import-playlists.controller';
import { ImportPlaylistsService } from './import-playlists.service';
import { ImportPlaylistItemsModule } from './items/import-playlist-items.module';

@Module({
  imports: [ImportPlaylistItemsModule],
  controllers: [ImportPlaylistsController],
  providers: [ImportPlaylistsService],
})
export class ImportPlaylistsModule {}
