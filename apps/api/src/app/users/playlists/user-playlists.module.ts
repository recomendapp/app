import { Module } from '@nestjs/common';
import { UserPlaylistsService } from './user-playlists.service';
import { UserPlaylistsController } from './user-playlists.controller';

@Module({
  controllers: [UserPlaylistsController],
  providers: [UserPlaylistsService],
  exports: [UserPlaylistsService],
})
export class UserPlaylistsModule {}