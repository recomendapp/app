import { Controller, Param, Get, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { TvSeriesService } from './tv-series.service';
import { OptionalAuthGuard } from '../auth/guards';
import { CurrentOptionalUser } from '../auth/decorators';
import { User } from '../auth/auth.service';
import { CurrentLocale } from '../../common/decorators/current-locale.decorator';
import { SupportedLocale } from '@libs/i18n';
import { TvSeriesDto } from './dto/tv-series.dto';
import { TvSeriesCastingDto } from './dto/tv-series-credits.dto';
import { TvSeasonCompactDto } from './seasons/dto/tv-seasons.dto';

@ApiTags('Tv Series')
@Controller({
  path: 'tv-series',
  version: '1',
})
export class TvSeriesController {
  constructor(private readonly tvSeriesService: TvSeriesService) {}

  @Get(':tv_series_id')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get the tv series details',
    type: TvSeriesDto,
  })
  async get(
    @Param('tv_series_id', ParseIntPipe) tvSeriesId: number,
    @CurrentOptionalUser() currentUser: User | null,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<TvSeriesDto> {
    return this.tvSeriesService.get({
      tvSeriesId,
      currentUser,
      locale,
    });
  }

  @Get(':tv_series_id/seasons')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get the tv series seasons',
    type: [TvSeasonCompactDto],
  })
  async getSeasons(
    @Param('tv_series_id', ParseIntPipe) tvSeriesId: number,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<TvSeasonCompactDto[]> {
    return this.tvSeriesService.getSeasons({
      tvSeriesId,
      locale,
    });
  }

  @Get(':tv_series_id/casting')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get the tv series casting information',
    type: [TvSeriesCastingDto],
  })
  async getCasting(
    @Param('tv_series_id', ParseIntPipe) tvSeriesId: number,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<TvSeriesCastingDto[]> {
    return this.tvSeriesService.getCasting({
      tvSeriesId,
      locale,
    });
  }
}