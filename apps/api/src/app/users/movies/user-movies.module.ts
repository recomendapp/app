import { Module } from '@nestjs/common';
import { UserMoviesService } from './user-movies.service';
import { UserMoviesController } from './user-movies.controller';
import { UserMoviesTool } from './user-movies.tool';

@Module({
  controllers: [UserMoviesController, UserMoviesTool],
  providers: [UserMoviesService],
  exports: [UserMoviesService],
})
export class UserMoviesModule {}
