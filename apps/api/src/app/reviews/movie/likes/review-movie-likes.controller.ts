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
import { ReviewMovieLikesService } from './review-movie-likes.service';
import {
  ReviewMovieLikeDto,
  ListPaginatedReviewMovieLikesDto,
  ListInfiniteReviewMovieLikesDto,
} from './dto/review-movie-like.dto';
import { PaginationQueryDto } from '../../../../common/dto/pagination.dto';
import { CursorPaginationQueryDto } from '../../../../common/dto/cursor-pagination.dto';

@ApiTags('Reviews')
@Controller({
  path: 'review/movie/:review_id',
  version: '1',
})
export class ReviewMovieLikesController {
  constructor(private readonly likesService: ReviewMovieLikesService) {}

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
    type: ReviewMovieLikeDto,
  })
  async like(
    @Param('review_id', ParseIntPipe) reviewId: number,
    @CurrentUser() user: User,
  ): Promise<ReviewMovieLikeDto> {
    return this.likesService.like({ user, reviewId });
  }

  @Delete('like')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Unlike a review.',
    type: ReviewMovieLikeDto,
  })
  async unlike(
    @Param('review_id', ParseIntPipe) reviewId: number,
    @CurrentUser() user: User,
  ): Promise<ReviewMovieLikeDto> {
    return this.likesService.unlike({ user, reviewId });
  }

  @Get('likes/paginated')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get the users who liked the review.',
    type: ListPaginatedReviewMovieLikesDto,
  })
  async listPaginated(
    @Param('review_id', ParseIntPipe) reviewId: number,
    @Query() query: PaginationQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
  ): Promise<ListPaginatedReviewMovieLikesDto> {
    return this.likesService.listPaginated({ reviewId, query, currentUser });
  }

  @Get('likes/infinite')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get the users who liked the review with cursor pagination.',
    type: ListInfiniteReviewMovieLikesDto,
  })
  async listInfinite(
    @Param('review_id', ParseIntPipe) reviewId: number,
    @Query() query: CursorPaginationQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
  ): Promise<ListInfiniteReviewMovieLikesDto> {
    return this.likesService.listInfinite({ reviewId, query, currentUser });
  }
}
