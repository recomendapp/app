import { Controller, Post, Param, Body, UseGuards, Get, Delete, ParseIntPipe, Query } from '@nestjs/common';
import { MovieLogsService } from './movie-logs.service';
import { LogMovieRequestDto, LogMovieDto } from './log-movie.dto';
import { ApiExtraModels, ApiOkResponse, ApiResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/guards';
import { CurrentUser } from '../../auth/decorators';
import { User } from '../../auth/auth.service';
import { MovieFollowingAverageRatingDto, MovieFollowingLogDto, MovieFollowingLogsQueryDto } from './movie-following-logs.dto';

@ApiTags('Movies')
@Controller({
  path: 'movie/:movie_id/log',
  version: '1',
})
export class MovieLogsController {
  constructor(private readonly logService: MovieLogsService) {}

  @Get()
  @UseGuards(AuthGuard)
  @ApiExtraModels(LogMovieDto)
  @ApiOkResponse({
    description: 'Get the movie log for the authenticated user',
    schema: {
      nullable: true,
      allOf: [
        { $ref: getSchemaPath(LogMovieDto) }
      ]
    }
  })
  async get(
    @Param('movie_id', ParseIntPipe) movieId: number,
    @CurrentUser() user: User,
  ): Promise<LogMovieDto | null> {
    return this.logService.get(user, movieId);
  }

  @Post()
  @UseGuards(AuthGuard)
  @ApiResponse({
    status: 200,
    description: 'Movie log created or updated successfully',
    type: LogMovieDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  async set(
    @Param('movie_id', ParseIntPipe) movieId: number,
    @Body() dto: LogMovieRequestDto,
	  @CurrentUser() user: User,
  ): Promise<LogMovieDto> {
    return this.logService.set(user, movieId, dto);
  }

  @Delete()
  @UseGuards(AuthGuard)
  @ApiResponse({
    status: 200,
    description: 'Movie log deleted successfully',
    type: LogMovieDto,
  })
  async delete(
    @Param('movie_id', ParseIntPipe) movieId: number,
    @CurrentUser() user: User,
  ): Promise<LogMovieDto> {
    return this.logService.delete(user, movieId);
  }

  // Following
  @Get('following')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Get all logs for this movie from users the authenticated user follows',
    type: [MovieFollowingLogDto],
  })
  async getFollowingLogs(
    @Param('movie_id', ParseIntPipe) movieId: number,
    @Query() dto: MovieFollowingLogsQueryDto,
    @CurrentUser() currentUser: User,
  ): Promise<MovieFollowingLogDto[]> {
    return this.logService.getFollowingLogs({
      currentUser,
      movieId,
      dto,
    });
  }

  @Get('following/average-rating')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Get the average rating for this movie from users the authenticated user follows',
    type: MovieFollowingAverageRatingDto,
  })
  async getFollowingAverageRating(
    @Param('movie_id', ParseIntPipe) movieId: number,
    @CurrentUser() currentUser: User,
  ): Promise<MovieFollowingAverageRatingDto> {
    return this.logService.getFollowingAverageRating({
      currentUser,
      movieId,
    });
  }
}