import { Module } from '@nestjs/common';
import { MovieReviewsService } from './movie-reviews.service';
import { MovieReviewsController } from './movie-reviews.controller';
import { MovieReviewsTool } from './movie-reviews.tool';

@Module({
  controllers: [MovieReviewsController, MovieReviewsTool],
  providers: [MovieReviewsService],
  exports: [MovieReviewsService],
})
export class MovieReviewsModule {}
