import { Module } from '@nestjs/common';
import { ReviewsMovieService } from './reviews-movie.service';
import { ReviewsMovieController } from './reviews-movie.controller';

@Module({
  controllers: [ReviewsMovieController],
  providers: [ReviewsMovieService],
  exports: [ReviewsMovieService],
})
export class ReviewsMovieModule {}