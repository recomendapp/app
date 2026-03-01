import { Controller, Post, Param, Body, UseGuards, Delete, ParseIntPipe, Patch, Get, Query } from '@nestjs/common';
import { MovieWatchedDatesService } from './movie-watched-dates.service';
import { ApiOkResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../../auth/guards';
import { ListInfiniteWatchedDatesDto, ListInfiniteWatchedDatesQueryDto, ListPaginatedWatchedDatesDto, ListPaginatedWatchedDatesQueryDto, WatchedDateCreateDto, WatchedDateResponseDto, WatchedDateUpdateDto } from './dto/watched-dates.dto';
import { CurrentUser } from '../../../auth/decorators';
import { User } from '../../../auth/auth.service';

@ApiTags('Movies')
@Controller({
  path: 'movie/:movie_id/log',
  version: '1',
})
export class MovieWatchedDatesController {
  constructor(private readonly watchedDateService: MovieWatchedDatesService) {}

  @Post('watched-date')
  @UseGuards(AuthGuard)
  @ApiResponse({ status: 201, type: WatchedDateResponseDto })
  async set(
    @Param('movie_id', ParseIntPipe) movieId: number,
    @Body() dto: WatchedDateCreateDto,
    @CurrentUser() user: User,
  ): Promise<WatchedDateResponseDto> {
    return this.watchedDateService.set({ user, movieId, dto });
  }

  @Patch('watched-date/:watched_date_id')
  @UseGuards(AuthGuard)
  @ApiOkResponse({ type: WatchedDateResponseDto })
  async update(
    @Param('movie_id', ParseIntPipe) movieId: number,
    @Param('watched_date_id', ParseIntPipe) watchedDateId: number,
    @Body() dto: WatchedDateUpdateDto,
    @CurrentUser() user: User,
  ): Promise<WatchedDateResponseDto> {
    return this.watchedDateService.update(user, movieId, watchedDateId, dto);
  }

  @Delete('watched-date/:watched_date_id')
  @UseGuards(AuthGuard)
  @ApiOkResponse({ type: WatchedDateResponseDto })
  async delete(
    @Param('movie_id', ParseIntPipe) movieId: number,
    @Param('watched_date_id', ParseIntPipe) watchedDateId: number,
    @CurrentUser() user: User,
  ): Promise<WatchedDateResponseDto> {
    return this.watchedDateService.delete(user, movieId, watchedDateId);
  }

  @Get('watched-dates/paginated')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Get the paginated history of watched dates for this movie',
    type: ListPaginatedWatchedDatesDto,
  })
  async listPaginated(
    @Param('movie_id', ParseIntPipe) movieId: number,
    @Query() query: ListPaginatedWatchedDatesQueryDto,
    @CurrentUser() user: User,
  ): Promise<ListPaginatedWatchedDatesDto> {
    return this.watchedDateService.listPaginated(user, movieId, query);
  }

  @Get('watched-dates/infinite')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Get the infinite scrolling history of watched dates',
    type: ListInfiniteWatchedDatesDto,
  })
  async listInfinite(
    @Param('movie_id', ParseIntPipe) movieId: number,
    @Query() query: ListInfiniteWatchedDatesQueryDto,
    @CurrentUser() user: User,
  ): Promise<ListInfiniteWatchedDatesDto> {
    return this.watchedDateService.listInfinite(user, movieId, query);
  }
}