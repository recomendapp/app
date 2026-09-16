import { Module } from '@nestjs/common';
import { ReviewTvSeriesLikesService } from './review-tv-series-likes.service';
import { ReviewTvSeriesLikesController } from './review-tv-series-likes.controller';
import { NotifySharedModule } from '@shared/notify';

@Module({
  imports: [NotifySharedModule],
  controllers: [ReviewTvSeriesLikesController],
  providers: [ReviewTvSeriesLikesService],
  exports: [ReviewTvSeriesLikesService],
})
export class ReviewTvSeriesLikesModule {}
