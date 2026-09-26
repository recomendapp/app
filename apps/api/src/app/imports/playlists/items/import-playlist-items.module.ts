import { Module } from '@nestjs/common';
import { ImportPlaylistItemsController } from './import-playlist-items.controller';
import { ImportPlaylistItemsTool } from './import-playlist-items.tool';
import { ImportPlaylistItemsService } from './import-playlist-items.service';

@Module({
  controllers: [ImportPlaylistItemsController, ImportPlaylistItemsTool],
  providers: [ImportPlaylistItemsService],
})
export class ImportPlaylistItemsModule {}
