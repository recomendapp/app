import { Module } from '@nestjs/common';
import { UserMoviesService } from './user-movies.service';
import { UserMoviesController } from './user-movies.controller';

@Module({
  controllers: [UserMoviesController],
  providers: [UserMoviesService],
  exports: [UserMoviesService],
})
export class UserMoviesModule {}