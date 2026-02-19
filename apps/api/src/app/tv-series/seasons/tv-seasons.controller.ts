import { Controller, Param, Get, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { TvSeasonsService } from './tv-seasons.service';
import { OptionalAuthGuard } from '../../auth/guards';
import { CurrentOptionalUser } from '../../auth/decorators';
import { User } from '../../auth/auth.service';
import { CurrentLocale } from '../../../common/decorators/current-locale.decorator';
import { SupportedLocale } from '@libs/i18n';
import { TvSeasonGetDTO } from './dto/tv-seasons.dto';
import { TvEpisodeDto } from '../episodes/dto/tv-episodes.dto';

@ApiTags('Tv Seasons')
@Controller({
  path: 'tv-series/:tv_series_id/seasons',
  version: '1',
})
export class TvSeasonsController {
  constructor(private readonly tvSeasonsService: TvSeasonsService) {}

  @Get(':season_number')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get the tv season details',
    type: TvSeasonGetDTO,
  })
  async get(
    @Param('tv_series_id', ParseIntPipe) tvSeriesId: number,
    @Param('season_number', ParseIntPipe) seasonNumber: number,
    @CurrentOptionalUser() currentUser: User | null,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<TvSeasonGetDTO> {
    return this.tvSeasonsService.get({
      tvSeriesId,
      seasonNumber,
      currentUser,
      locale,
    });
  }

  @Get(':season_number/episodes')
  @ApiOkResponse({
    description: 'Get all episodes of the tv season',
    type: [TvEpisodeDto],
  })
  async getEpisodes(
    @Param('tv_series_id', ParseIntPipe) tvSeriesId: number,
    @Param('season_number', ParseIntPipe) seasonNumber: number,
    @CurrentOptionalUser() currentUser: User | null,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<TvEpisodeDto[]> {
    return this.tvSeasonsService.getEpisodes({
      tvSeriesId,
      seasonNumber,
      currentUser,
      locale,
    });
  }  
}