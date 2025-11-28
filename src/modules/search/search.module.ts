import { Module } from '@nestjs/common';
import { PlaylistsSearchModule } from './playlists/playlists-search.module';
import { UsersSearchModule } from './users/users-search.module';
import { PersonsSearchModule } from './persons/persons-search.module';

@Module({
  imports: [PersonsSearchModule, PlaylistsSearchModule, UsersSearchModule],
})
export class SearchModule {}
