import { Module } from '@nestjs/common';
import { MePlaylistsFollowingController } from './me-playlists-following.controller';
import { MePlaylistsFollowingService } from './me-playlists-following.service';

@Module({
  controllers: [MePlaylistsFollowingController],
  providers: [MePlaylistsFollowingService],
  exports: [MePlaylistsFollowingService],
})
export class MePlaylistsFollowingModule {}
