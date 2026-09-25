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
import { CurrentOptionalUser, CurrentUser } from '../../../../auth/decorators';
import { User } from '../../../../auth/auth.service';
import { ReviewTvSeriesCommentLikesService } from './review-tv-series-comment-likes.service';
import {
  ReviewTvSeriesCommentLikeDto,
  ListPaginatedReviewTvSeriesCommentLikesDto,
  ListInfiniteReviewTvSeriesCommentLikesDto,
} from './dto/review-tv-series-comment-like.dto';
import { PaginationQueryDto } from '../../../../../common/dto/pagination.dto';
import { CursorPaginationQueryDto } from '../../../../../common/dto/cursor-pagination.dto';

@ApiTags('Reviews')
@Controller({
  path: 'review/tv-series/:review_id/comments/:comment_id',
  version: '1',
})
export class ReviewTvSeriesCommentLikesController {
  constructor(private readonly likesService: ReviewTvSeriesCommentLikesService) {}

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
    type: ReviewTvSeriesCommentLikeDto,
  })
  async like(
    @Param('review_id', ParseIntPipe) reviewId: number,
    @Param('comment_id', ParseIntPipe) commentId: number,
    @CurrentUser() user: User,
  ): Promise<ReviewTvSeriesCommentLikeDto> {
    return this.likesService.like({ user, reviewId, commentId });
  }

  @Delete('like')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Unlike a comment.',
    type: ReviewTvSeriesCommentLikeDto,
  })
  async unlike(
    @Param('review_id', ParseIntPipe) reviewId: number,
    @Param('comment_id', ParseIntPipe) commentId: number,
    @CurrentUser() user: User,
  ): Promise<ReviewTvSeriesCommentLikeDto> {
    return this.likesService.unlike({ user, reviewId, commentId });
  }

  @Get('likes/paginated')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get the users who liked the comment.',
    type: ListPaginatedReviewTvSeriesCommentLikesDto,
  })
  async listPaginated(
    @Param('review_id', ParseIntPipe) reviewId: number,
    @Param('comment_id', ParseIntPipe) commentId: number,
    @Query() query: PaginationQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
  ): Promise<ListPaginatedReviewTvSeriesCommentLikesDto> {
    return this.likesService.listPaginated({ reviewId, commentId, query, currentUser });
  }

  @Get('likes/infinite')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get the users who liked the comment with cursor pagination.',
    type: ListInfiniteReviewTvSeriesCommentLikesDto,
  })
  async listInfinite(
    @Param('review_id', ParseIntPipe) reviewId: number,
    @Param('comment_id', ParseIntPipe) commentId: number,
    @Query() query: CursorPaginationQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
  ): Promise<ListInfiniteReviewTvSeriesCommentLikesDto> {
    return this.likesService.listInfinite({ reviewId, commentId, query, currentUser });
  }
}
