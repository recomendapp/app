import { Controller, Param, UseGuards, ParseIntPipe, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { OptionalAuthGuard } from '../../auth/guards';
import { CurrentLocale } from '../../../common/decorators/current-locale.decorator';
import { SupportedLocale } from '@libs/i18n';
import { 
  ListInfiniteTvSeriesImagesDto, 
  ListInfiniteTvSeriesImagesQueryDto, 
  ListPaginatedTvSeriesImagesDto, 
  ListPaginatedTvSeriesImagesQueryDto 
} from './tv-series-images.dto';
import { TvSeriesImagesService } from './tv-series-images.service';

@ApiTags('Tv Series')
@Controller({
  path: 'tv-series/:tv_series_id/images',
  version: '1',
})
export class TvSeriesImagesController {
  constructor(private readonly imageService: TvSeriesImagesService) {}

  @Get('paginated')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({ type: ListPaginatedTvSeriesImagesDto })
  async listPaginated(
    @Param('tv_series_id', ParseIntPipe) tvSeriesId: number,
    @Query() query: ListPaginatedTvSeriesImagesQueryDto,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ListPaginatedTvSeriesImagesDto> {
    return this.imageService.listPaginated({
      tvSeriesId,
      query,
      locale,
    });
  }

  @Get('infinite')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({ type: ListInfiniteTvSeriesImagesDto })
  async listInfinite(
    @Param('tv_series_id', ParseIntPipe) tvSeriesId: number,
    @Query() query: ListInfiniteTvSeriesImagesQueryDto,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ListInfiniteTvSeriesImagesDto> {
    return this.imageService.listInfinite({
      tvSeriesId,
      query,
      locale,
    });
  }
}