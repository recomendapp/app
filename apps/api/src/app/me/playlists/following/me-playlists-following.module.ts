import { Module } from '@nestjs/common';
import { MePlaylistsFollowingController } from './me-playlists-following.controller';
import { MePlaylistsFollowingTool } from './me-playlists-following.tool';
import { MePlaylistsFollowingService } from './me-playlists-following.service';

@Module({
  controllers: [MePlaylistsFollowingController, MePlaylistsFollowingTool],
  providers: [MePlaylistsFollowingService],
  exports: [MePlaylistsFollowingService],
})
export class MePlaylistsFollowingModule {}
