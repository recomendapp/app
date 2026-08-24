import { Module } from '@nestjs/common';
import { ImportPlaylistItemsController } from './import-playlist-items.controller';
import { ImportPlaylistItemsService } from './import-playlist-items.service';

@Module({
  controllers: [ImportPlaylistItemsController],
  providers: [ImportPlaylistItemsService],
})
export class ImportPlaylistItemsModule {}
