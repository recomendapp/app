import { Controller, Post, Param, Body, UseGuards, Get, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/guards';
import { CurrentUser } from '../../auth/decorators';
import { User } from '../../auth/auth.service';
import { TvSeriesLogsService } from './tv-series-logs.service';
import { LogTvSeriesDto, LogTvSeriesRequestDto } from './tv-series-logs.dto';

@ApiTags('Tv Series')
@Controller({
  path: 'tv-series/:tv_series_id/log',
  version: '1',
})
export class TvSeriesLogsController {
  constructor(private readonly logService: TvSeriesLogsService) {}

  @Get()
  @UseGuards(AuthGuard)
  @ApiExtraModels(LogTvSeriesDto)
  @ApiOkResponse({
    description: 'Get the tv series log for the authenticated user',
    schema: {
      nullable: true,
      allOf: [
        { $ref: getSchemaPath(LogTvSeriesDto) }
      ]
    }
  })
  async get(
    @Param('tv_series_id', ParseIntPipe) tvSeriesId: number,
    @CurrentUser() currentUser: User
  ): Promise<LogTvSeriesDto | null> {
    return this.logService.get({
      currentUser,
      tvSeriesId,
    });
  }

  @Post()
  @UseGuards(AuthGuard)
  @ApiResponse({
    status: 200,
    description: 'Tv series log created or updated successfully',
    type: LogTvSeriesDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  async set(
    @Param('tv_series_id', ParseIntPipe) tvSeriesId: number,
    @Body() dto: LogTvSeriesRequestDto,
    @CurrentUser() currentUser: User,
  ): Promise<LogTvSeriesDto> {
    return this.logService.set({
      currentUser,
      tvSeriesId,
      dto
    });
  }

  @Delete()
  @UseGuards(AuthGuard)
  @ApiResponse({
    status: 200,
    description: 'Tv series log deleted successfully',
    type: LogTvSeriesDto,
  })
  async delete(
    @Param('tv_series_id', ParseIntPipe) tvSeriesId: number,
    @CurrentUser() currentUser: User
  ): Promise<LogTvSeriesDto> {
    return this.logService.delete({
      currentUser,
      tvSeriesId,
    });
  }
}