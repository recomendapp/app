import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TvSeriesSearchService } from './tv-series-search.service';
import { SearchTvSeriesQueryDto } from './dto/search-tv-series-query.dto';
import { SearchTvSeriesResponseDto } from './dto/search-tv-series-response.dto';

@ApiTags('Search')
@Controller({
  path: 'search/tv-series',
  version: '1',
})
export class TvSeriesSearchController {
  constructor(private readonly tvSeriesSearchService: TvSeriesSearchService) {}

  @Get()
  @ApiOperation({
    summary: 'Search TV series',
    description:
      'Search for TV series using full-text search and advanced filtering.',
  })
  @ApiResponse({
    status: 200,
    description: 'TV series found successfully',
    type: SearchTvSeriesResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters',
  })
  async search(
    @Query() query: SearchTvSeriesQueryDto,
  ): Promise<SearchTvSeriesResponseDto> {
    const result = await this.tvSeriesSearchService.search(query);
    return new SearchTvSeriesResponseDto(result);
  }
}
