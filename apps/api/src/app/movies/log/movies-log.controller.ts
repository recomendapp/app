import { Controller, Post, Param, Body, UseGuards, Get } from '@nestjs/common';
import { MoviesLogService } from './movies-log.service';
import { LogMovieRequestDto, LogMovieDto } from './dto/log-movie.dto';
import { ApiOkResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/guards';
import { CurrentUser } from '../../auth/decorators';
import { User } from '../../auth/auth.service';

@ApiTags('Movies')
@Controller({
  path: 'movie',
  version: '1',
})
export class MoviesLogController {
  constructor(private readonly logService: MoviesLogService) {}

  @Get(':movie_id/log')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Get the movie log for the authenticated user',
    type: LogMovieDto || null,
  })
  async getMovieLog(
    @Param('movie_id') movieId: string,
    @CurrentUser() user: User,
  ): Promise<LogMovieDto | null> {
    return this.logService.getLog(user, Number(movieId));
  }

  @Post(':movie_id/log')
  @UseGuards(AuthGuard)
  @ApiResponse({
    status: 200,
    description: 'Movie log created or updated successfully',
    type: LogMovieDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  async postMovieLog(
    @Param('movie_id') movieId: string,
    @Body() dto: LogMovieRequestDto,
	  @CurrentUser() user: User,
  ): Promise<LogMovieDto> {
    return this.logService.setLog(user, Number(movieId), dto);
  }
}