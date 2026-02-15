import { Module } from '@nestjs/common';
import { ReviewsMovieModule } from './movie/reviews-movie.module';

@Module({
  imports: [
	ReviewsMovieModule,
  ],
})
export class ReviewsModule {}
