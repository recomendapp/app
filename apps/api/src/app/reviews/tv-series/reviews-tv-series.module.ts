import { Module } from '@nestjs/common';
import { ReviewTvSeriesLikesModule } from './likes/review-tv-series-likes.module';
import { ReviewTvSeriesCommentsModule } from './comments/review-tv-series-comments.module';

@Module({
  imports: [ReviewTvSeriesLikesModule, ReviewTvSeriesCommentsModule],
})
export class ReviewsTvSeriesModule {}
