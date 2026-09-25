import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { SearchPlaylistsService } from './search-playlists.service';
import { McpAuthenticatedRequest } from '../../auth/types/fastify';

const searchPlaylistsParameters = z.object({
  q: z.string().min(1).describe('The search query, e.g. a playlist title or description'),
  page: z.number().int().min(1).default(1).describe('Page number'),
  perPage: z.number().int().min(1).max(50).default(10).describe('Number of results per page'),
});

@McpController()
export class SearchPlaylistsTool {
  constructor(private readonly searchPlaylistsService: SearchPlaylistsService) {}

  @Tool({
    name: 'search-playlists',
    description:
      'Search playlists only. Only playlists visible to the current user are returned. ' +
      'Prefer the "search" tool when the kind of item is unknown.',
    parameters: searchPlaylistsParameters,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async searchPlaylists(
    @Payload() { q, page, perPage }: z.infer<typeof searchPlaylistsParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const playlists = await this.searchPlaylistsService.listPaginated({
      currentUser: request.user,
      dto: { q, page, per_page: perPage },
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(playlists) }],
    };
  }
}
