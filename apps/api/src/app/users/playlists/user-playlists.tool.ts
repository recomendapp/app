import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { PlaylistSortBy } from '../../playlists/dto/playlists.dto';
import { SortOrder } from '../../../common/dto/sort.dto';
import { z } from 'zod';
import { UserPlaylistsService } from './user-playlists.service';
import { McpAuthenticatedRequest } from '../../auth/types/fastify';

const userPlaylistsParameters = z.object({
  userId: z.uuid().optional().describe('The id of the user. Defaults to the current user'),
  sortBy: z.enum(PlaylistSortBy).default(PlaylistSortBy.UPDATED_AT).describe('Sort field'),
  sortOrder: z.enum(SortOrder).default(SortOrder.DESC).describe('Sort order'),
  page: z.number().int().min(1).default(1).describe('Page number'),
  perPage: z.number().int().min(1).max(50).default(20).describe('Number of results per page'),
});

@McpController()
export class UserPlaylistsTool {
  constructor(private readonly userPlaylistsService: UserPlaylistsService) {}

  @Tool({
    name: 'list-user-playlists',
    description: 'List the playlists owned by a user and visible to the current user',
    parameters: userPlaylistsParameters,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async listUserPlaylists(
    @Payload()
    { userId, sortBy, sortOrder, page, perPage }: z.infer<typeof userPlaylistsParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const result = await this.userPlaylistsService.listPaginated({
      targetUserId: userId ?? request.user.id,
      query: { sort_by: sortBy, sort_order: sortOrder, page, per_page: perPage },
      currentUser: request.user,
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result) }],
    };
  }
}
