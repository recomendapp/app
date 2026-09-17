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
import { ReviewMovieCommentsService } from './review-movie-comments.service';
import {
  ListInfiniteReviewMovieCommentsDto,
  ListInfiniteReviewMovieCommentsQueryDto,
  ListPaginatedReviewMovieCommentsDto,
  ListPaginatedReviewMovieCommentsQueryDto,
  ReviewMovieCommentInputDto,
  ReviewMovieCommentUpdateInputDto,
  ReviewMovieCommentWithAuthorDto,
} from './dto/review-movie-comments.dto';

@ApiTags('Reviews')
@Controller({
  path: 'review/movie/:review_id/comments',
  version: '1',
})
export class ReviewMovieCommentsController {
  constructor(private readonly commentsService: ReviewMovieCommentsService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Create a comment, or a reply if parentId is given.',
    type: ReviewMovieCommentWithAuthorDto,
  })
  create(
    @Param('review_id', ParseIntPipe) reviewId: number,
    @Body() dto: ReviewMovieCommentInputDto,
    @CurrentUser() user: User,
  ): Promise<ReviewMovieCommentWithAuthorDto> {
    return this.commentsService.create({ user, reviewId, dto });
  }

  @Get('paginated')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get the top-level comments of a review.',
    type: ListPaginatedReviewMovieCommentsDto,
  })
  listPaginated(
    @Param('review_id', ParseIntPipe) reviewId: number,
    @Query() query: ListPaginatedReviewMovieCommentsQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
  ): Promise<ListPaginatedReviewMovieCommentsDto> {
    return this.commentsService.listPaginated({ reviewId, query, currentUser });
  }

  @Get('infinite')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get the top-level comments of a review with cursor pagination.',
    type: ListInfiniteReviewMovieCommentsDto,
  })
  listInfinite(
    @Param('review_id', ParseIntPipe) reviewId: number,
    @Query() query: ListInfiniteReviewMovieCommentsQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
  ): Promise<ListInfiniteReviewMovieCommentsDto> {
    return this.commentsService.listInfinite({ reviewId, query, currentUser });
  }

  @Get(':comment_id/replies/paginated')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get the replies of a comment.',
    type: ListPaginatedReviewMovieCommentsDto,
  })
  listRepliesPaginated(
    @Param('review_id', ParseIntPipe) reviewId: number,
    @Param('comment_id', ParseIntPipe) commentId: number,
    @Query() query: ListPaginatedReviewMovieCommentsQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
  ): Promise<ListPaginatedReviewMovieCommentsDto> {
    return this.commentsService.listRepliesPaginated({ reviewId, commentId, query, currentUser });
  }

  @Get(':comment_id/replies/infinite')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get the replies of a comment with cursor pagination.',
    type: ListInfiniteReviewMovieCommentsDto,
  })
  listRepliesInfinite(
    @Param('review_id', ParseIntPipe) reviewId: number,
    @Param('comment_id', ParseIntPipe) commentId: number,
    @Query() query: ListInfiniteReviewMovieCommentsQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
  ): Promise<ListInfiniteReviewMovieCommentsDto> {
    return this.commentsService.listRepliesInfinite({ reviewId, commentId, query, currentUser });
  }

  @Patch(':comment_id')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Edit your own comment.',
    type: ReviewMovieCommentWithAuthorDto,
  })
  update(
    @Param('review_id', ParseIntPipe) reviewId: number,
    @Param('comment_id', ParseIntPipe) commentId: number,
    @Body() dto: ReviewMovieCommentUpdateInputDto,
    @CurrentUser() user: User,
  ): Promise<ReviewMovieCommentWithAuthorDto> {
    return this.commentsService.update({ user, reviewId, commentId, dto });
  }

  @Delete(':comment_id')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Soft-delete a comment (author of the comment or the review).',
    type: ReviewMovieCommentWithAuthorDto,
  })
  delete(
    @Param('review_id', ParseIntPipe) reviewId: number,
    @Param('comment_id', ParseIntPipe) commentId: number,
    @CurrentUser() user: User,
  ): Promise<ReviewMovieCommentWithAuthorDto> {
    return this.commentsService.delete({ user, reviewId, commentId });
  }
}
