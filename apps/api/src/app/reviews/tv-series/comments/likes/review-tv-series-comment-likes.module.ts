import { Module } from '@nestjs/common';
import { ReviewTvSeriesCommentLikesController } from './review-tv-series-comment-likes.controller';
import { ReviewTvSeriesCommentLikesService } from './review-tv-series-comment-likes.service';
import { NotifySharedModule } from '@shared/notify';

@Module({
  imports: [NotifySharedModule],
  controllers: [ReviewTvSeriesCommentLikesController],
  providers: [ReviewTvSeriesCommentLikesService],
  exports: [ReviewTvSeriesCommentLikesService],
})
export class ReviewTvSeriesCommentLikesModule {}
