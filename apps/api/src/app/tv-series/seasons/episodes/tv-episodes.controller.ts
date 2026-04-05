import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { TvEpisodesService } from './tv-episodes.service';
import { CurrentLocale } from '../../../../common/decorators/current-locale.decorator';
import { SupportedLocale } from '@libs/i18n';
import { User } from '../../../auth/auth.service';
import { 
  ListAllTvEpisodesQueryDto, 
  ListInfiniteTvEpisodesDto, 
  ListInfiniteTvEpisodesQueryDto, 
  ListPaginatedTvEpisodesDto, 
  ListPaginatedTvEpisodesQueryDto, 
  TvEpisodeDto 
} from './tv-episodes.dto';
import { CurrentUser } from '../../../auth/decorators';

@ApiTags('Tv Episodes')
@Controller({
  path: 'tv-series/:tv_series_id/season/:season_number/episodes',
  version: '1',
})
export class TvEpisodesController {
  constructor(private readonly tvEpisodesService: TvEpisodesService) {}

  @Get('all')
  @ApiOkResponse({
    description: 'Get a full list of episodes for a specific TV season',
    type: [TvEpisodeDto],
  })
  async listAll(
    @Param('tv_series_id', ParseIntPipe) tvSeriesId: number,
    @Param('season_number', ParseIntPipe) seasonNumber: number,
    @Query() query: ListAllTvEpisodesQueryDto,
    @CurrentLocale() locale: SupportedLocale,
    @CurrentUser() currentUser: User | null,
  ): Promise<TvEpisodeDto[]> {
    return this.tvEpisodesService.listAll({
      tvSeriesId,
      seasonNumber,
      query,
      locale,
      currentUser,
    });
  }

  @Get('paginated')
  @ApiOkResponse({
    description: 'Get a paginated list of episodes for a specific TV season',
    type: ListPaginatedTvEpisodesDto,
  })
  async listPaginated(
    @Param('tv_series_id', ParseIntPipe) tvSeriesId: number,
    @Param('season_number', ParseIntPipe) seasonNumber: number,
    @Query() query: ListPaginatedTvEpisodesQueryDto,
    @CurrentLocale() locale: SupportedLocale,
    @CurrentUser() currentUser: User | null,
  ): Promise<ListPaginatedTvEpisodesDto> {
    return this.tvEpisodesService.listPaginated({
      tvSeriesId,
      seasonNumber,
      query,
      locale,
      currentUser,
    });
  }

  @Get('infinite')
  @ApiOkResponse({
    description: 'Get an infinite scrolling list of episodes for a specific TV season',
    type: ListInfiniteTvEpisodesDto,
  })
  async listInfinite(
    @Param('tv_series_id', ParseIntPipe) tvSeriesId: number,
    @Param('season_number', ParseIntPipe) seasonNumber: number,
    @Query() query: ListInfiniteTvEpisodesQueryDto,
    @CurrentLocale() locale: SupportedLocale,
    @CurrentUser() currentUser: User | null,
  ): Promise<ListInfiniteTvEpisodesDto> {
    return this.tvEpisodesService.listInfinite({
      tvSeriesId,
      seasonNumber,
      query,
      locale,
      currentUser,
    });
  }
}