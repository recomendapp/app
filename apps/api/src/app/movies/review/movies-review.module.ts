import { Module } from '@nestjs/common';
import { MoviesReviewService } from './movies-review.service';
import { MoviesReviewController } from './movies-review.controller';

@Module({
  controllers: [MoviesReviewController],
  providers: [MoviesReviewService],
  exports: [MoviesReviewService],
})
export class MoviesReviewModule {}