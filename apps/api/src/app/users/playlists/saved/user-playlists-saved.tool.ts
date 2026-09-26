import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { PlaylistSavedSortBy } from '../../../playlists/saves/dto/playlist-saved.dto';
import { SortOrder } from '../../../../common/dto/sort.dto';
import { z } from 'zod';
import { UserPlaylistsSavedService } from './user-playlists-saved.service';
import { McpAuthenticatedRequest } from '../../../auth/types/fastify';

const userPlaylistsSavedParameters = z.object({
  userId: z.uuid().optional().describe('The id of the user. Defaults to the current user'),
  sortBy: z.enum(PlaylistSavedSortBy).default(PlaylistSavedSortBy.SAVED_AT).describe('Sort field'),
  sortOrder: z.enum(SortOrder).default(SortOrder.DESC).describe('Sort order'),
  page: z.number().int().min(1).default(1).describe('Page number'),
  perPage: z.number().int().min(1).max(50).default(20).describe('Number of results per page'),
});

@McpController()
export class UserPlaylistsSavedTool {
  constructor(private readonly userPlaylistsSavedService: UserPlaylistsSavedService) {}

  @Tool({
    name: 'list-user-saved-playlists',
    description: 'List the playlists of other users that a user saved to their library',
    parameters: userPlaylistsSavedParameters,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async listUserSavedPlaylists(
    @Payload()
    { userId, sortBy, sortOrder, page, perPage }: z.infer<typeof userPlaylistsSavedParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const result = await this.userPlaylistsSavedService.listPaginated({
      targetUserId: userId ?? request.user.id,
      query: { sort_by: sortBy, sort_order: sortOrder, page, per_page: perPage },
      currentUser: request.user,
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result) }],
    };
  }
}
