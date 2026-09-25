import { Module } from '@nestjs/common';
import { UserPlaylistsService } from './user-playlists.service';
import { UserPlaylistsController } from './user-playlists.controller';
import { UserPlaylistsTool } from './user-playlists.tool';
import { UserPlaylistsSavedModule } from './saved/user-playlists-saved.module';

@Module({
  imports: [UserPlaylistsSavedModule],
  controllers: [UserPlaylistsController, UserPlaylistsTool],
  providers: [UserPlaylistsService],
  exports: [UserPlaylistsService],
})
export class UserPlaylistsModule {}
