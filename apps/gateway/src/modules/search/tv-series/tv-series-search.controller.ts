import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TvSeriesSearchService } from './tv-series-search.service';
import { SearchTvSeriesQueryDto } from './dto/search-tv-series-query.dto';
import { SearchTvSeriesResponse } from './dto/search-tv-series-response.dto';
import { ApiLanguageHeader } from 'apps/gateway/src/common/decorators/api-language-header.decorator';

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
    type: SearchTvSeriesResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters',
  })
  @ApiLanguageHeader()
  async search(
    @Query() query: SearchTvSeriesQueryDto,
  ): Promise<SearchTvSeriesResponse> {
    const result = await this.tvSeriesSearchService.search(query);
    return new SearchTvSeriesResponse(result);
  }
}
