import { Controller, Param, UseGuards, Post, Get, ParseIntPipe, Delete } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/guards';
import { CurrentUser } from '../../auth/decorators';
import { User } from '../../auth/auth.service';
import { ReviewTvSeriesLikeDto } from './dto/review-tv-series-like.dto';
import { ReviewsTvSeriesService } from './reviews-tv-series.service';

@ApiTags('Reviews')
@Controller({
  path: 'review/tv-series/:review_id',
  version: '1',
})
export class ReviewsTvSeriesController {
  constructor(private readonly reviewsService: ReviewsTvSeriesService) {}

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
    return this.reviewsService.getLike({
      user,
      reviewId,
    });
  }

  @Post('like')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Like a review.',
    type: ReviewTvSeriesLikeDto
  })
  async like(
    @Param('review_id', ParseIntPipe) reviewId: number,
    @CurrentUser() user: User,
  ): Promise<ReviewTvSeriesLikeDto> {
    return this.reviewsService.like({ user, reviewId });
  }

  @Delete('like')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Unlike a review.',
    type: ReviewTvSeriesLikeDto
  })
  async unlike(
    @Param('review_id', ParseIntPipe) reviewId: number,
    @CurrentUser() user: User,
  ): Promise<ReviewTvSeriesLikeDto> {
    return this.reviewsService.unlike({ user, reviewId });
  }
}