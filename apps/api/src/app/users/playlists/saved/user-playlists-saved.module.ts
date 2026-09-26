import { Module } from '@nestjs/common';
import { UserPlaylistsSavedService } from './user-playlists-saved.service';
import { UserPlaylistsSavedController } from './user-playlists-saved.controller';
import { UserPlaylistsSavedTool } from './user-playlists-saved.tool';

@Module({
  controllers: [UserPlaylistsSavedController, UserPlaylistsSavedTool],
  providers: [UserPlaylistsSavedService],
  exports: [UserPlaylistsSavedService],
})
export class UserPlaylistsSavedModule {}
