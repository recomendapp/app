import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { MePlaylistsFollowingService } from './me-playlists-following.service';
import { PlaylistSortBy } from '../../../playlists/dto/playlists.dto';
import { McpAuthenticatedRequest } from '../../../auth/types/fastify';
import { SortOrder } from '../../../../common/dto/sort.dto';

const listFollowingPlaylistsParameters = z.object({
  sortBy: z.enum(PlaylistSortBy).default(PlaylistSortBy.UPDATED_AT).describe('Sort field'),
  sortOrder: z.enum(SortOrder).default(SortOrder.DESC).describe('Sort order'),
  page: z.number().int().min(1).default(1).describe('Page number'),
  perPage: z.number().int().min(1).max(50).default(20).describe('Number of results per page'),
});

@McpController()
export class MePlaylistsFollowingTool {
  constructor(private readonly mePlaylistsFollowingService: MePlaylistsFollowingService) {}

  @Tool({
    name: 'list-following-playlists',
    description: 'List the playlists of the users the current user follows',
    parameters: listFollowingPlaylistsParameters,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async listFollowingPlaylists(
    @Payload()
    { sortBy, sortOrder, page, perPage }: z.infer<typeof listFollowingPlaylistsParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const playlists = await this.mePlaylistsFollowingService.listPaginated({
      currentUser: request.user,
      query: { sort_by: sortBy, sort_order: sortOrder, page, per_page: perPage },
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(playlists) }],
    };
  }
}
