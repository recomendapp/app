import { Module } from '@nestjs/common';
import { PlaylistsAddTargetsController } from './playlists-add-targets.controller';
import { PlaylistsAddTargetsTool } from './playlists-add-targets.tool';
import { PlaylistsAddTargetsService } from './playlists-add-targets.service';

@Module({
  controllers: [PlaylistsAddTargetsController, PlaylistsAddTargetsTool],
  providers: [PlaylistsAddTargetsService],
  exports: [PlaylistsAddTargetsService],
})
export class PlaylistsAddTargetsModule {}
