import { Controller, Post, Param, Body, UseGuards, Get, ParseIntPipe, Delete } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { AuthGuard } from '../../../auth/guards';
import { CurrentUser } from '../../../auth/decorators';
import { User } from '../../../auth/auth.service';
import { TvSeasonLogsService } from './tv-season-logs.service';
import { LogTvSeasonDto, LogTvSeasonRequestDto, LogTvSeasonUpdateResponseDto } from './tv-season-logs.dto';

@ApiTags('Tv Seasons')
@Controller({
  path: 'tv-series/:tv_series_id/season/:season_number/log',
  version: '1',
})
export class TvSeasonLogsController {
  constructor(private readonly seasonLogsService: TvSeasonLogsService) {}

  @Get()
  @UseGuards(AuthGuard)
  @ApiExtraModels(LogTvSeasonDto)
  @ApiOkResponse({
    description: 'Get the tv season log for the authenticated user',
    schema: {
      nullable: true,
      allOf: [
        { $ref: getSchemaPath(LogTvSeasonDto) }
      ]
    }
  })
  async get(
    @Param('tv_series_id', ParseIntPipe) tvSeriesId: number,
    @Param('season_number', ParseIntPipe) seasonNumber: number,
    @CurrentUser() currentUser: User,
  ): Promise<LogTvSeasonDto | null> {
    return this.seasonLogsService.get({
      currentUser,
      tvSeriesId,
      seasonNumber,
    });
  }

  @Post()
  @UseGuards(AuthGuard)
  @ApiResponse({
    status: 200,
    description: 'Tv season log created or updated successfully',
    type: LogTvSeasonUpdateResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  async set(
    @Param('tv_series_id', ParseIntPipe) tvSeriesId: number,
    @Param('season_number', ParseIntPipe) seasonNumber: number,
    @Body() dto: LogTvSeasonRequestDto, 
    @CurrentUser() currentUser: User,
  ): Promise<LogTvSeasonUpdateResponseDto> {
    return this.seasonLogsService.set({
      currentUser,
      tvSeriesId,
      seasonNumber,
      dto,
    });
  }

  @Delete()
  @UseGuards(AuthGuard)
  @ApiResponse({
    status: 200,
    description: 'Tv season log deleted successfully',
    type: LogTvSeasonUpdateResponseDto,
  })
  async delete(
    @Param('tv_series_id', ParseIntPipe) tvSeriesId: number,
    @Param('season_number', ParseIntPipe) seasonNumber: number,
    @CurrentUser() currentUser: User,
  ): Promise<LogTvSeasonUpdateResponseDto> {
    return this.seasonLogsService.delete({
      currentUser,
      tvSeriesId,
      seasonNumber,
    });
  }
}