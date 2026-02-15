import { Controller, Param, UseGuards, Post, Get, ParseIntPipe, Delete } from '@nestjs/common';
import { ApiOkResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/guards';
import { CurrentUser } from '../../auth/decorators';
import { User } from '../../auth/auth.service';
import { ReviewsMovieService } from './reviews-movie.service';
import { ReviewMovieLikeDto } from './dto/review-movie-like.dto';

@ApiTags('Reviews')
@Controller({
  path: 'review/movie/:review_id',
  version: '1',
})
export class ReviewsMovieController {
  constructor(private readonly reviewsService: ReviewsMovieService) {}

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
    type: ReviewMovieLikeDto
  })
  async like(
    @Param('review_id', ParseIntPipe) reviewId: number,
    @CurrentUser() user: User,
  ): Promise<ReviewMovieLikeDto> {
    return this.reviewsService.like({ user, reviewId });
  }

  @Delete('like')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Unlike a review.',
    type: ReviewMovieLikeDto
  })
  async unlike(
    @Param('review_id', ParseIntPipe) reviewId: number,
    @CurrentUser() user: User,
  ): Promise<ReviewMovieLikeDto> {
    return this.reviewsService.unlike({ user, reviewId });
  }
}