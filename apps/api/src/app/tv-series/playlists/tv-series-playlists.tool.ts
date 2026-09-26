import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { TvSeriesPlaylistsService } from './tv-series-playlists.service';
import { McpAuthenticatedRequest } from '../../auth/types/fastify';
import { PlaylistSortBy } from '../../playlists/dto/playlists.dto';
import { SortOrder } from '../../../common/dto/sort.dto';

const listTvSeriesPlaylistsParameters = z.object({
  tvSeriesId: z.number().int().describe('The TMDB id of the TV series'),
  sortBy: z.enum(PlaylistSortBy).default(PlaylistSortBy.UPDATED_AT).describe('Sort field'),
  sortOrder: z.enum(SortOrder).default(SortOrder.DESC).describe('Sort order'),
  page: z.number().int().min(1).default(1).describe('Page number'),
  perPage: z.number().int().min(1).max(50).default(10).describe('Number of results per page'),
});

@McpController()
export class TvSeriesPlaylistsTool {
  constructor(private readonly tvSeriesPlaylistsService: TvSeriesPlaylistsService) {}

  @Tool({
    name: 'list-tv-series-playlists',
    description: 'List the playlists that contain a TV series, visible to the current user',
    parameters: listTvSeriesPlaylistsParameters,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async listTvSeriesPlaylists(
    @Payload()
    {
      tvSeriesId,
      sortBy,
      sortOrder,
      page,
      perPage,
    }: z.infer<typeof listTvSeriesPlaylistsParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const playlists = await this.tvSeriesPlaylistsService.listPaginated({
      tvSeriesId,
      currentUser: request.user,
      query: { sort_by: sortBy, sort_order: sortOrder, page, per_page: perPage },
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(playlists) }],
    };
  }
}
