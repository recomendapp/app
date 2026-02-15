import { Module } from '@nestjs/common';
import { MoviesLogModule } from './log/movies-log.module';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';
import { MoviesReviewModule } from './review/movies-review.module';

@Module({
  imports: [
    MoviesLogModule,
    MoviesReviewModule,
  ],
  controllers: [MoviesController],
  providers: [MoviesService],
  exports: [MoviesService],
})
export class MoviesModule {}
