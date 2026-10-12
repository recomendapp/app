import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { TvSeriesMetadataService } from './tv-series-metadata.service';
import { TvSeriesMetadataDto } from './tv-series-metadata.dto';

@ApiTags('TV Series')
@Controller({
  path: 'tv-series/:tv_series_id',
  version: '1',
})
export class TvSeriesMetadataController {
  constructor(private readonly tvSeriesMetadataService: TvSeriesMetadataService) {}

  @Get('metadata')
  @ApiOkResponse({
    description: 'Locales that genuinely translate this series, for the page hreflang set',
    type: TvSeriesMetadataDto,
  })
  async get(@Param('tv_series_id', ParseIntPipe) tvSeriesId: number): Promise<TvSeriesMetadataDto> {
    return this.tvSeriesMetadataService.get(tvSeriesId);
  }
}
