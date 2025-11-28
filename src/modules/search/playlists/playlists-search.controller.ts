import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { OptionalJwtAuthGuard } from '../../auth/guards/optional-jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PlaylistsSearchService } from './playlists-search.service';
import { SearchPlaylistsQueryDto } from './dto/search-playlists-query.dto';
import { SearchPlaylistsResponseDto } from './dto/search-playlists-response.dto';
import type { FastifyRequest } from 'fastify';

@ApiTags('Search')
@Controller({
  path: 'search/playlists',
  version: '1',
})
export class PlaylistsSearchController {
  constructor(
    private readonly playlistsSearchService: PlaylistsSearchService,
  ) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Search playlists',
    description:
      'Search for playlists using full-text search. Returns public playlists or user-owned playlists if authenticated.',
  })
  @ApiResponse({
    status: 200,
    description: 'Playlists found successfully',
    type: SearchPlaylistsResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters',
  })
  async search(
    @Query() query: SearchPlaylistsQueryDto,
    @Request() req: FastifyRequest,
  ): Promise<SearchPlaylistsResponseDto> {
    const userId = req?.user?.sub;

    const result = await this.playlistsSearchService.search({
      ...query,
      userId,
    });
    return new SearchPlaylistsResponseDto(result);
  }
}
