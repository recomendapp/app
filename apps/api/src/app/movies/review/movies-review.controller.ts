import { Controller, Post, Param, Body, UseGuards, Delete, ParseIntPipe } from '@nestjs/common';
import { MoviesReviewService } from './movies-review.service';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/guards';
import { CurrentUser } from '../../auth/decorators';
import { User } from '../../auth/auth.service';
import { ReviewMovieDto, ReviewMovieInputDto } from '../../reviews/movie/dto/reviews-movie.dto';

@ApiTags('Movies')
@Controller({
  path: 'movie/:movie_id/review',
  version: '1',
})
export class MoviesReviewController {
  constructor(private readonly reviewService: MoviesReviewService) {}

  @Post()
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

  @Delete()
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
}