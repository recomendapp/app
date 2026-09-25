import { Module } from '@nestjs/common';
import { ReviewMovieCommentsController } from './review-movie-comments.controller';
import { ReviewMovieCommentsTool } from './review-movie-comments.tool';
import { ReviewMovieCommentsService } from './review-movie-comments.service';
import { ReviewMovieCommentLikesModule } from './likes/review-movie-comment-likes.module';
import { NotifySharedModule } from '@shared/notify';

@Module({
  imports: [ReviewMovieCommentLikesModule, NotifySharedModule],
  controllers: [ReviewMovieCommentsController, ReviewMovieCommentsTool],
  providers: [ReviewMovieCommentsService],
  exports: [ReviewMovieCommentsService],
})
export class ReviewMovieCommentsModule {}
