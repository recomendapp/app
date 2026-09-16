import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard, OptionalAuthGuard } from '../../../auth/guards';
import { CurrentOptionalUser, CurrentUser } from '../../../auth/decorators';
import { User } from '../../../auth/auth.service';
import { ReviewTvSeriesCommentsService } from './review-tv-series-comments.service';
import {
  ListInfiniteReviewTvSeriesCommentsDto,
  ListInfiniteReviewTvSeriesCommentsQueryDto,
  ListPaginatedReviewTvSeriesCommentsDto,
  ListPaginatedReviewTvSeriesCommentsQueryDto,
  ReviewTvSeriesCommentInputDto,
  ReviewTvSeriesCommentUpdateInputDto,
  ReviewTvSeriesCommentWithAuthorDto,
} from './dto/review-tv-series-comments.dto';

@ApiTags('Reviews')
@Controller({
  path: 'review/tv-series/:review_id/comments',
  version: '1',
})
export class ReviewTvSeriesCommentsController {
  constructor(private readonly commentsService: ReviewTvSeriesCommentsService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Create a comment, or a reply if parentId is given.',
    type: ReviewTvSeriesCommentWithAuthorDto,
  })
  create(
    @Param('review_id', ParseIntPipe) reviewId: number,
    @Body() dto: ReviewTvSeriesCommentInputDto,
    @CurrentUser() user: User,
  ): Promise<ReviewTvSeriesCommentWithAuthorDto> {
    return this.commentsService.create({ user, reviewId, dto });
  }

  @Get('paginated')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get the top-level comments of a review.',
    type: ListPaginatedReviewTvSeriesCommentsDto,
  })
  listPaginated(
    @Param('review_id', ParseIntPipe) reviewId: number,
    @Query() query: ListPaginatedReviewTvSeriesCommentsQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
  ): Promise<ListPaginatedReviewTvSeriesCommentsDto> {
    return this.commentsService.listPaginated({ reviewId, query, currentUser });
  }

  @Get('infinite')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get the top-level comments of a review with cursor pagination.',
    type: ListInfiniteReviewTvSeriesCommentsDto,
  })
  listInfinite(
    @Param('review_id', ParseIntPipe) reviewId: number,
    @Query() query: ListInfiniteReviewTvSeriesCommentsQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
  ): Promise<ListInfiniteReviewTvSeriesCommentsDto> {
    return this.commentsService.listInfinite({ reviewId, query, currentUser });
  }

  @Get(':comment_id/replies/paginated')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get the replies of a comment.',
    type: ListPaginatedReviewTvSeriesCommentsDto,
  })
  listRepliesPaginated(
    @Param('review_id', ParseIntPipe) reviewId: number,
    @Param('comment_id', ParseIntPipe) commentId: number,
    @Query() query: ListPaginatedReviewTvSeriesCommentsQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
  ): Promise<ListPaginatedReviewTvSeriesCommentsDto> {
    return this.commentsService.listRepliesPaginated({ reviewId, commentId, query, currentUser });
  }

  @Get(':comment_id/replies/infinite')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get the replies of a comment with cursor pagination.',
    type: ListInfiniteReviewTvSeriesCommentsDto,
  })
  listRepliesInfinite(
    @Param('review_id', ParseIntPipe) reviewId: number,
    @Param('comment_id', ParseIntPipe) commentId: number,
    @Query() query: ListInfiniteReviewTvSeriesCommentsQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
  ): Promise<ListInfiniteReviewTvSeriesCommentsDto> {
    return this.commentsService.listRepliesInfinite({ reviewId, commentId, query, currentUser });
  }

  @Patch(':comment_id')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Edit your own comment.',
    type: ReviewTvSeriesCommentWithAuthorDto,
  })
  update(
    @Param('review_id', ParseIntPipe) reviewId: number,
    @Param('comment_id', ParseIntPipe) commentId: number,
    @Body() dto: ReviewTvSeriesCommentUpdateInputDto,
    @CurrentUser() user: User,
  ): Promise<ReviewTvSeriesCommentWithAuthorDto> {
    return this.commentsService.update({ user, reviewId, commentId, dto });
  }

  @Delete(':comment_id')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Soft-delete a comment (author of the comment or the review).',
    type: ReviewTvSeriesCommentWithAuthorDto,
  })
  delete(
    @Param('review_id', ParseIntPipe) reviewId: number,
    @Param('comment_id', ParseIntPipe) commentId: number,
    @CurrentUser() user: User,
  ): Promise<ReviewTvSeriesCommentWithAuthorDto> {
    return this.commentsService.delete({ user, reviewId, commentId });
  }
}
