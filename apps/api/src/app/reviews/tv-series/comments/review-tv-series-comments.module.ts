import { Module } from '@nestjs/common';
import { ReviewTvSeriesCommentsController } from './review-tv-series-comments.controller';
import { ReviewTvSeriesCommentsTool } from './review-tv-series-comments.tool';
import { ReviewTvSeriesCommentsService } from './review-tv-series-comments.service';
import { ReviewTvSeriesCommentLikesModule } from './likes/review-tv-series-comment-likes.module';
import { NotifySharedModule } from '@shared/notify';

@Module({
  imports: [ReviewTvSeriesCommentLikesModule, NotifySharedModule],
  controllers: [ReviewTvSeriesCommentsController, ReviewTvSeriesCommentsTool],
  providers: [ReviewTvSeriesCommentsService],
  exports: [ReviewTvSeriesCommentsService],
})
export class ReviewTvSeriesCommentsModule {}
