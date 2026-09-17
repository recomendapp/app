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
import { AuthGuard, OptionalAuthGuard } from '../../../auth/guards';
import { CurrentOptionalUser, CurrentUser } from '../../../auth/decorators';
import { User } from '../../../auth/auth.service';
import { ReviewTvSeriesLikesService } from './review-tv-series-likes.service';
import {
  ReviewTvSeriesLikeDto,
  ListPaginatedReviewTvSeriesLikesDto,
  ListInfiniteReviewTvSeriesLikesDto,
} from './dto/review-tv-series-like.dto';
import { PaginationQueryDto } from '../../../../common/dto/pagination.dto';
import { CursorPaginationQueryDto } from '../../../../common/dto/cursor-pagination.dto';

@ApiTags('Reviews')
@Controller({
  path: 'review/tv-series/:review_id',
  version: '1',
})
export class ReviewTvSeriesLikesController {
  constructor(private readonly likesService: ReviewTvSeriesLikesService) {}

  @Get('like')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Get like status of the review for the current user.',
    type: Boolean,
  })
  getLikeStatus(
    @CurrentUser() user: User,
    @Param('review_id', ParseIntPipe) reviewId: number,
  ): Promise<boolean> {
    return this.likesService.getLike({
      user,
      reviewId,
    });
  }

  @Post('like')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Like a review.',
    type: ReviewTvSeriesLikeDto,
  })
  async like(
    @Param('review_id', ParseIntPipe) reviewId: number,
    @CurrentUser() user: User,
  ): Promise<ReviewTvSeriesLikeDto> {
    return this.likesService.like({ user, reviewId });
  }

  @Delete('like')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Unlike a review.',
    type: ReviewTvSeriesLikeDto,
  })
  async unlike(
    @Param('review_id', ParseIntPipe) reviewId: number,
    @CurrentUser() user: User,
  ): Promise<ReviewTvSeriesLikeDto> {
    return this.likesService.unlike({ user, reviewId });
  }

  @Get('likes/paginated')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get the users who liked the review.',
    type: ListPaginatedReviewTvSeriesLikesDto,
  })
  async listPaginated(
    @Param('review_id', ParseIntPipe) reviewId: number,
    @Query() query: PaginationQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
  ): Promise<ListPaginatedReviewTvSeriesLikesDto> {
    return this.likesService.listPaginated({ reviewId, query, currentUser });
  }

  @Get('likes/infinite')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get the users who liked the review with cursor pagination.',
    type: ListInfiniteReviewTvSeriesLikesDto,
  })
  async listInfinite(
    @Param('review_id', ParseIntPipe) reviewId: number,
    @Query() query: CursorPaginationQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
  ): Promise<ListInfiniteReviewTvSeriesLikesDto> {
    return this.likesService.listInfinite({ reviewId, query, currentUser });
  }
}
