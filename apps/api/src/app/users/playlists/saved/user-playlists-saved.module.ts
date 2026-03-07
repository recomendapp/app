import { Module } from '@nestjs/common';
import { UserPlaylistsSavedService } from './user-playlists-saved.service';
import { UserPlaylistsSavedController } from './user-playlists-saved.controller';

@Module({
  controllers: [UserPlaylistsSavedController],
  providers: [UserPlaylistsSavedService],
  exports: [UserPlaylistsSavedService],
})
export class UserPlaylistsSavedModule {}