import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { OptionalAuthGuard } from '@app/shared';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BestResultSearchService } from './best-result-search.service';
import { BestResultSearchQueryDto } from './dto/best-result-search-query.dto';
import { SearchBestResultResponse } from './dto/best-result-search-response.dto';
import type { FastifyRequest } from 'fastify';
import { ApiLanguageHeader } from 'apps/gateway/src/common/decorators/api-language-header.decorator';

@ApiTags('Search')
@Controller({
  path: 'search/best-result',
  version: '1',
})
export class BestResultSearchController {
  constructor(
    private readonly bestResultSearchService: BestResultSearchService,
  ) {}

  @Get()
  @UseGuards(OptionalAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Search for the best result across all types',
    description:
      'Returns the top search results for movies, TV series, people, playlists, and users.',
  })
  @ApiResponse({
    status: 200,
    description: 'Best results found successfully',
    type: SearchBestResultResponse,
  })
  @ApiLanguageHeader()
  async search(
    @Query() query: BestResultSearchQueryDto,
    @Request() req: FastifyRequest,
  ): Promise<SearchBestResultResponse> {
    const userId = req?.user?.id;
    const result = await this.bestResultSearchService.search({
      ...query,
      userId,
    });
    return new SearchBestResultResponse(result);
  }
}
