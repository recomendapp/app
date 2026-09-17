import {
  Controller,
  Param,
  UseGuards,
  Post,
  Get,
  ParseIntPipe,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard, OptionalAuthGuard } from '../../../../auth/guards';
import { CurrentUser } from '../../../../auth/decorators';
import { User } from '../../../../auth/auth.service';
import { ReviewMovieCommentLikesService } from './review-movie-comment-likes.service';
import {
  ReviewMovieCommentLikeDto,
  ListPaginatedReviewMovieCommentLikesDto,
  ListInfiniteReviewMovieCommentLikesDto,
} from './dto/review-movie-comment-like.dto';
import { PaginationQueryDto } from '../../../../../common/dto/pagination.dto';
import { CursorPaginationQueryDto } from '../../../../../common/dto/cursor-pagination.dto';

@ApiTags('Reviews')
@Controller({
  path: 'review/movie/:review_id/comments/:comment_id',
  version: '1',
})
export class ReviewMovieCommentLikesController {
  constructor(private readonly likesService: ReviewMovieCommentLikesService) {}

  @Get('like')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Get like status of the comment for the current user.',
    type: Boolean,
  })
  getLikeStatus(
    @CurrentUser() user: User,
    @Param('review_id', ParseIntPipe) reviewId: number,
    @Param('comment_id', ParseIntPipe) commentId: number,
  ): Promise<boolean> {
    return this.likesService.getLike({ user, reviewId, commentId });
  }

  @Post('like')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Like a comment.',
    type: ReviewMovieCommentLikeDto,
  })
  async like(
    @Param('review_id', ParseIntPipe) reviewId: number,
    @Param('comment_id', ParseIntPipe) commentId: number,
    @CurrentUser() user: User,
  ): Promise<ReviewMovieCommentLikeDto> {
    return this.likesService.like({ user, reviewId, commentId });
  }

  @Delete('like')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Unlike a comment.',
    type: ReviewMovieCommentLikeDto,
  })
  async unlike(
    @Param('review_id', ParseIntPipe) reviewId: number,
    @Param('comment_id', ParseIntPipe) commentId: number,
    @CurrentUser() user: User,
  ): Promise<ReviewMovieCommentLikeDto> {
    return this.likesService.unlike({ user, reviewId, commentId });
  }

  @Get('likes/paginated')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get the users who liked the comment.',
    type: ListPaginatedReviewMovieCommentLikesDto,
  })
  async listPaginated(
    @Param('review_id', ParseIntPipe) reviewId: number,
    @Param('comment_id', ParseIntPipe) commentId: number,
    @Query() query: PaginationQueryDto,
  ): Promise<ListPaginatedReviewMovieCommentLikesDto> {
    return this.likesService.listPaginated({ reviewId, commentId, query });
  }

  @Get('likes/infinite')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get the users who liked the comment with cursor pagination.',
    type: ListInfiniteReviewMovieCommentLikesDto,
  })
  async listInfinite(
    @Param('review_id', ParseIntPipe) reviewId: number,
    @Param('comment_id', ParseIntPipe) commentId: number,
    @Query() query: CursorPaginationQueryDto,
  ): Promise<ListInfiniteReviewMovieCommentLikesDto> {
    return this.likesService.listInfinite({ reviewId, commentId, query });
  }
}
