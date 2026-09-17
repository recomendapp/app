import { Module } from '@nestjs/common';
import { ReviewMovieLikesModule } from './likes/review-movie-likes.module';
import { ReviewMovieCommentsModule } from './comments/review-movie-comments.module';

@Module({
  imports: [ReviewMovieLikesModule, ReviewMovieCommentsModule],
})
export class ReviewsMovieModule {}
