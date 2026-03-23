import { Module } from '@nestjs/common';
import { SearchMoviesController } from './search-movies.controller';
import { SearchMoviesService } from './search-movies.service';

@Module({
  controllers: [SearchMoviesController],
  providers: [SearchMoviesService],
  exports: [SearchMoviesService],
})
export class SearchMoviesModule {}
