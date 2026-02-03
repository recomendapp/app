import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { MovieReviewsController } from './movie-reviews.controller';
import { TvSeriesReviewsController } from './tv-series-reviews.controller';
import { SupabaseModule } from '../../common/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [MovieReviewsController, TvSeriesReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
