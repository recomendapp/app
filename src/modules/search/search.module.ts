import { Module } from '@nestjs/common';
import { PlaylistsSearchModule } from './playlists/playlists-search.module';
import { UsersSearchModule } from './users/users-search.module';
import { PersonsSearchModule } from './persons/persons-search.module';
import { TvSeriesSearchModule } from './tv-series/tv-series-search.module';

@Module({
  imports: [
    PersonsSearchModule,
    PlaylistsSearchModule,
    UsersSearchModule,
    TvSeriesSearchModule,
  ],
})
export class SearchModule {}
