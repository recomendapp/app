import { Controller, Post, Param, Body, UseGuards, Get, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TvEpisodeLogsService } from './tv-episode-logs.service';
import { AuthGuard } from '../../../../auth/guards';
import { CurrentUser } from '../../../../auth/decorators';
import { User } from '../../../../auth/auth.service';
import { LogTvEpisodeRequestDto } from './tv-episode-logs.dto';

@ApiTags('Tv Episodes')
@Controller({
  path: 'tv-series/:tv_series_id/season/:season_number/episode/:episode_number/log',
  version: '1',
})
export class TvEpisodeLogsController {
  constructor(private readonly episodeLogsService: TvEpisodeLogsService) {}

  @Get()
  @UseGuards(AuthGuard)
  async get(
    @Param('tv_series_id', ParseIntPipe) tvSeriesId: number,
    @Param('season_number', ParseIntPipe) seasonNumber: number,
    @Param('episode_number', ParseIntPipe) episodeNumber: number,
    @CurrentUser() currentUser: User,
  ) {
    return this.episodeLogsService.get({
      currentUser,
      tvSeriesId,
      seasonNumber,
      episodeNumber,
    });
  }

  @Post()
  @UseGuards(AuthGuard)
  async set(
    @Param('tv_series_id', ParseIntPipe) tvSeriesId: number,
    @Param('season_number', ParseIntPipe) seasonNumber: number,
    @Param('episode_number', ParseIntPipe) episodeNumber: number,
    @Body() dto: LogTvEpisodeRequestDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.episodeLogsService.set({
      currentUser,
      tvSeriesId,
      seasonNumber,
      episodeNumber,
      dto,
    });
  }

  @Delete()
  @UseGuards(AuthGuard)
  async delete(
    @Param('tv_series_id', ParseIntPipe) tvSeriesId: number,
    @Param('season_number', ParseIntPipe) seasonNumber: number,
    @Param('episode_number', ParseIntPipe) episodeNumber: number,
    @CurrentUser() currentUser: User,
  ) {
    return this.episodeLogsService.delete({
      currentUser,
      tvSeriesId,
      seasonNumber,
      episodeNumber,
    });
  }
}