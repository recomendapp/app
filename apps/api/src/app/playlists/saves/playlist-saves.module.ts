import { Module } from '@nestjs/common';
import { PlaylistSavesController } from './playlist-saves.controller';
import { PlaylistSavesService } from './playlist-saves.service';

@Module({
  controllers: [PlaylistSavesController],
  providers: [PlaylistSavesService],
  exports: [PlaylistSavesService],
})
export class PlaylistSavesModule {}