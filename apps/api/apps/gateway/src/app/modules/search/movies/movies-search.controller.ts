import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MoviesSearchService } from './movies-search.service';
import { SearchMoviesQueryDto } from './dto/search-movies-query.dto';
import { SearchMoviesResponse } from './dto/search-movies-response.dto';
import { ApiLanguageHeader } from '../../../common/decorators/api-language-header.decorator';

@ApiTags('Search')
@Controller({
  path: 'search/movies',
  version: '1',
})
export class MoviesSearchController {
  constructor(private readonly moviesSearchService: MoviesSearchService) {}

  @Get()
  @ApiOperation({
    summary: 'Search movies',
    description:
      'Search for movies using full-text search and advanced filtering.',
  })
  @ApiResponse({
    status: 200,
    description: 'Movies found successfully',
    type: SearchMoviesResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters',
  })
  @ApiLanguageHeader()
  async search(
    @Query() query: SearchMoviesQueryDto,
  ): Promise<SearchMoviesResponse> {
    const result = await this.moviesSearchService.search(query);
    return new SearchMoviesResponse(result);
  }
}
