import { Module } from '@nestjs/common';
import { UsersMovieService } from './users-movie.service';
import { UsersMovieController } from './users-movie.controller';

@Module({
  controllers: [UsersMovieController],
  providers: [UsersMovieService],
  exports: [UsersMovieService],
})
export class UsersMovieModule {}