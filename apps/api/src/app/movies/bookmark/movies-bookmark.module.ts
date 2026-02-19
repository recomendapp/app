import { Module } from '@nestjs/common';
import { MoviesBookmarkService } from './movies-bookmark.service';
import { MoviesBookmarkController } from './movies-bookmark.controller';

@Module({
  controllers: [MoviesBookmarkController],
  providers: [MoviesBookmarkService],
  exports: [MoviesBookmarkService],
})
export class MoviesBookmarkModule {}