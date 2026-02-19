import { Module } from '@nestjs/common';
import { ReviewsMovieModule } from './movie/reviews-movie.module';
import { ReviewsTvSeriesModule } from './tv-series/reviews-tv-series.module';

@Module({
  imports: [
	ReviewsMovieModule,
  ReviewsTvSeriesModule,
  ],
})
export class ReviewsModule {}
