import { Controller, Param, Get, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { TvSeriesService } from './tv-series.service';
import { OptionalAuthGuard } from '../auth/guards';
import { CurrentOptionalUser } from '../auth/decorators';
import { User } from '../auth/auth.service';
import { CurrentLocale } from '../../common/decorators/current-locale.decorator';
import { SupportedLocale } from '@libs/i18n';
import { TvSeriesDto } from './dto/tv-series.dto';

@ApiTags('Tv Series')
@Controller({
  path: 'tv-series',
  version: '1',
})
export class TvSeriesController {
  constructor(private readonly TvSeriesService: TvSeriesService) {}

  @Get(':tv_series_id')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get the tv series details',
    type: TvSeriesDto,
  })
  async getTvSeries(
    @Param('tv_series_id', ParseIntPipe) tvSeriesId: number,
    @CurrentOptionalUser() currentUser: User | null,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<TvSeriesDto> {
    return this.TvSeriesService.get({
      tvSeriesId,
      currentUser,
      locale,
    });
  }
}