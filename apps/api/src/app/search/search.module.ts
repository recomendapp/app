import { Module } from '@nestjs/common';
import { TypesenseModule } from '../../common/modules/typesense/typesense.module';
import { SearchUsersModule } from './users/search-users.module';
import { SearchPlaylistsModule } from './playlists/search-playlists.module';
import { SearchMoviesModule } from './movies/search-movies.module';
import { SearchTvSeriesModule } from './tv-series/search-tv-series.module';
import { SearchPersonsModule } from './persons/search-persons.module';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [
    TypesenseModule,
    SearchUsersModule,
    SearchPlaylistsModule,
    SearchMoviesModule,
    SearchTvSeriesModule,
    SearchPersonsModule,
  ],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
