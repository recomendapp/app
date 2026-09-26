import { Module } from '@nestjs/common';
import { PlaylistSavesController } from './playlist-saves.controller';
import { PlaylistSavesTool } from './playlist-saves.tool';
import { PlaylistSavesService } from './playlist-saves.service';

@Module({
  controllers: [PlaylistSavesController, PlaylistSavesTool],
  providers: [PlaylistSavesService],
  exports: [PlaylistSavesService],
})
export class PlaylistSavesModule {}
