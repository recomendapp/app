import { Module } from '@nestjs/common';
import { SearchMoviesController } from './search-movies.controller';
import { SearchMoviesService } from './search-movies.service';
import { SearchMoviesTool } from './search-movies.tool';

@Module({
  controllers: [SearchMoviesController, SearchMoviesTool],
  providers: [SearchMoviesService],
  exports: [SearchMoviesService],
})
export class SearchMoviesModule {}
