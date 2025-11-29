import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PersonsSearchService } from './persons-search.service';
import { SearchPersonsQueryDto } from './dto/search-persons-query.dto';
import { SearchPersonsResponse } from './dto/search-persons-response.dto';

@ApiTags('Search')
@Controller({
  path: 'search/persons',
  version: '1',
})
export class PersonsSearchController {
  constructor(private readonly personsSearchService: PersonsSearchService) {}

  @Get()
  @ApiOperation({
    summary: 'Search persons',
    description:
      'Search for persons (actors, directors, etc.) using full-text search.',
  })
  @ApiResponse({
    status: 200,
    description: 'Persons found successfully',
    type: SearchPersonsResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters',
  })
  async search(
    @Query() query: SearchPersonsQueryDto,
  ): Promise<SearchPersonsResponse> {
    const result = await this.personsSearchService.search(query);
    return new SearchPersonsResponse(result);
  }
}
