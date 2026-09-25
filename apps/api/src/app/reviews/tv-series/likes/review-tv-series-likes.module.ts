import { Module } from '@nestjs/common';
import { ReviewTvSeriesLikesService } from './review-tv-series-likes.service';
import { ReviewTvSeriesLikesController } from './review-tv-series-likes.controller';
import { ReviewTvSeriesLikesTool } from './review-tv-series-likes.tool';
import { NotifySharedModule } from '@shared/notify';

@Module({
  imports: [NotifySharedModule],
  controllers: [ReviewTvSeriesLikesController, ReviewTvSeriesLikesTool],
  providers: [ReviewTvSeriesLikesService],
  exports: [ReviewTvSeriesLikesService],
})
export class ReviewTvSeriesLikesModule {}
