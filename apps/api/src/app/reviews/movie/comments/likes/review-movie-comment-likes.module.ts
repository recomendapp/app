import { Module } from '@nestjs/common';
import { ReviewMovieCommentLikesController } from './review-movie-comment-likes.controller';
import { ReviewMovieCommentLikesTool } from './review-movie-comment-likes.tool';
import { ReviewMovieCommentLikesService } from './review-movie-comment-likes.service';
import { NotifySharedModule } from '@shared/notify';

@Module({
  imports: [NotifySharedModule],
  controllers: [ReviewMovieCommentLikesController, ReviewMovieCommentLikesTool],
  providers: [ReviewMovieCommentLikesService],
  exports: [ReviewMovieCommentLikesService],
})
export class ReviewMovieCommentLikesModule {}
