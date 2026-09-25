import { Module } from '@nestjs/common';
import { ReviewMovieLikesService } from './review-movie-likes.service';
import { ReviewMovieLikesController } from './review-movie-likes.controller';
import { ReviewMovieLikesTool } from './review-movie-likes.tool';
import { NotifySharedModule } from '@shared/notify';

@Module({
  imports: [NotifySharedModule],
  controllers: [ReviewMovieLikesController, ReviewMovieLikesTool],
  providers: [ReviewMovieLikesService],
  exports: [ReviewMovieLikesService],
})
export class ReviewMovieLikesModule {}
