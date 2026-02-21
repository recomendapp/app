import { Module } from '@nestjs/common';
import { PersonMoviesService } from './person-movies.service';
import { PersonMoviesController } from './person-movies.controller';

@Module({
  controllers: [PersonMoviesController],
  providers: [PersonMoviesService],
  exports: [PersonMoviesService],
})
export class PersonMoviesModule {}