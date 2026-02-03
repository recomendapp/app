import { Module } from '@nestjs/common';
import { PlaylistsSearchModule } from './playlists/playlists-search.module';
import { UsersSearchModule } from './users/users-search.module';
import { PersonsSearchModule } from './persons/persons-search.module';
import { TvSeriesSearchModule } from './tv-series/tv-series-search.module';
import { MoviesSearchModule } from './movies/movies-search.module';
import { BestResultSearchModule } from './best-result/best-result-search.module';

@Module({
  imports: [
    MoviesSearchModule,
    TvSeriesSearchModule,
    PersonsSearchModule,
    PlaylistsSearchModule,
    UsersSearchModule,
    BestResultSearchModule,
  ],
})
export class SearchModule {}
