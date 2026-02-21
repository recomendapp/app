import { Controller, Post, Param, Body, UseGuards, Delete, ParseIntPipe, Get, Query } from '@nestjs/common';
import { MovieReviewsService } from './movie-reviews.service';
import { ApiOkResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard, OptionalAuthGuard } from '../../auth/guards';
import { CurrentOptionalUser, CurrentUser } from '../../auth/decorators';
import { User } from '../../auth/auth.service';
import { ListInfiniteReviewsMovieDto, ListInfiniteReviewsMovieQueryDto, ListReviewsMovieDto, ListReviewsMovieQueryDto, ReviewMovieDto, ReviewMovieInputDto } from '../../reviews/movie/dto/reviews-movie.dto';

@ApiTags('Movies')
@Controller({
  path: 'movie/:movie_id',
  version: '1',
})
export class MovieReviewsController {
  constructor(private readonly reviewService: MovieReviewsService) {}

  @Post('review')
  @UseGuards(AuthGuard)
  @ApiResponse({
    status: 200,
    description: 'Movie review created or updated successfully',
    type: ReviewMovieDto,
  })
  async upsert(
    @Param('movie_id', ParseIntPipe) movieId: number,
    @Body() dto: ReviewMovieInputDto,
	  @CurrentUser() user: User,
  ): Promise<ReviewMovieDto> {
    return this.reviewService.upsert({
      user,
      movieId,
      dto,
    });
  }

  @Delete('review')
  @UseGuards(AuthGuard)
  @ApiResponse({
    status: 200,
    description: 'Movie review deleted successfully',
    type: ReviewMovieDto,
  })
  async delete(
    @Param('movie_id', ParseIntPipe) movieId: number,
    @CurrentUser() user: User,
  ): Promise<ReviewMovieDto> {
    return this.reviewService.delete({
      user,
      movieId,
    });
  }

  /* ---------------------------------- List ---------------------------------- */
  @Get('reviews')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get the list of movie reviews for the user',
    type: ListReviewsMovieDto,
  })
  async list(
    @Param('movie_id', ParseIntPipe) movieId: number,
    @Query() query: ListReviewsMovieQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
  ): Promise<ListReviewsMovieDto> {
    return this.reviewService.list({
      movieId,
      query,
      currentUser,
    })
  }

  @Get('reviews/infinite')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get the list of movie reviews for the user with cursor pagination',
    type: ListInfiniteReviewsMovieDto,
  })
  async listInfinite(
    @Param('movie_id', ParseIntPipe) movieId: number,
    @Query() query: ListInfiniteReviewsMovieQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
  ): Promise<ListInfiniteReviewsMovieDto> {
    return this.reviewService.listInfinite({
      movieId,
      query,
      currentUser,
    });
  }
}