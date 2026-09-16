import { Module } from '@nestjs/common';
import { ReviewTvSeriesCommentsController } from './review-tv-series-comments.controller';
import { ReviewTvSeriesCommentsService } from './review-tv-series-comments.service';
import { ReviewTvSeriesCommentLikesModule } from './likes/review-tv-series-comment-likes.module';
import { NotifySharedModule } from '@shared/notify';

@Module({
  imports: [ReviewTvSeriesCommentLikesModule, NotifySharedModule],
  controllers: [ReviewTvSeriesCommentsController],
  providers: [ReviewTvSeriesCommentsService],
  exports: [ReviewTvSeriesCommentsService],
})
export class ReviewTvSeriesCommentsModule {}
