import { Module } from '@nestjs/common';
import { PersonMoviesService } from './person-movies.service';
import { PersonMoviesController } from './person-movies.controller';
import { PersonMoviesTool } from './person-movies.tool';

@Module({
  controllers: [PersonMoviesController, PersonMoviesTool],
  providers: [PersonMoviesService],
  exports: [PersonMoviesService],
})
export class PersonMoviesModule {}
