import { Module } from '@nestjs/common';
import { PlaylistsSearchModule } from './playlists/playlists-search.module';
import { UsersSearchModule } from './users/users-search.module';

@Module({
  imports: [PlaylistsSearchModule, UsersSearchModule],
})
export class SearchModule {}
