import { Module } from '@nestjs/common';
import { MoviesLogModule } from './log/movies-log.module';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';
import { MoviesReviewModule } from './review/movies-review.module';
import { MoviesBookmarkModule } from './bookmark/movies-bookmark.module';

@Module({
  imports: [
    MoviesLogModule,
    MoviesReviewModule,
    MoviesBookmarkModule,
  ],
  controllers: [MoviesController],
  providers: [MoviesService],
  exports: [MoviesService],
})
export class MoviesModule {}
