import { Module } from '@nestjs/common';
import { MovieBookmarksService } from './movie-bookmarks.service';
import { MovieBookmarksController } from './movie-bookmarks.controller';

@Module({
  controllers: [MovieBookmarksController],
  providers: [MovieBookmarksService],
  exports: [MovieBookmarksService],
})
export class MovieBookmarksModule {}