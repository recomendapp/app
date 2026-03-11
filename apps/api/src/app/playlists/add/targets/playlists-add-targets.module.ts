import { Module } from '@nestjs/common';
import { PlaylistsAddTargetsController } from './playlists-add-targets.controller';
import { PlaylistsAddTargetsService } from './playlists-add-targets.service';

@Module({
  controllers: [PlaylistsAddTargetsController],
  providers: [PlaylistsAddTargetsService],
  exports: [PlaylistsAddTargetsService],
})
export class PlaylistsAddTargetsModule {}