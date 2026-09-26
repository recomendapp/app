import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { PlaylistFeaturedService } from './playlist-featured.service';
import { PlaylistSortBy } from '../dto/playlists.dto';
import { McpAuthenticatedRequest } from '../../auth/types/fastify';
import { SortOrder } from '../../../common/dto/sort.dto';

const listFeaturedPlaylistsParameters = z.object({
  sortBy: z.enum(PlaylistSortBy).default(PlaylistSortBy.UPDATED_AT).describe('Sort field'),
  sortOrder: z.enum(SortOrder).default(SortOrder.DESC).describe('Sort order'),
  page: z.number().int().min(1).default(1).describe('Page number'),
  perPage: z.number().int().min(1).max(50).default(10).describe('Number of results per page'),
});

@McpController()
export class PlaylistFeaturedTool {
  constructor(private readonly playlistFeaturedService: PlaylistFeaturedService) {}

  @Tool({
    name: 'list-featured-playlists',
    description: 'List the featured playlists visible to the current user',
    parameters: listFeaturedPlaylistsParameters,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async listFeaturedPlaylists(
    @Payload()
    { sortBy, sortOrder, page, perPage }: z.infer<typeof listFeaturedPlaylistsParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const playlists = await this.playlistFeaturedService.listPaginated({
      currentUser: request.user,
      query: { sort_by: sortBy, sort_order: sortOrder, page, per_page: perPage },
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(playlists) }],
    };
  }
}
