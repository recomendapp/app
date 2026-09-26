import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { getLocaleFromHeaders } from '@libs/i18n';
import { z } from 'zod';
import { SearchService } from './search.service';
import { McpAuthenticatedRequest } from '../auth/types/fastify';

@McpController()
export class SearchTool {
  constructor(private readonly searchService: SearchService) {}

  @Tool({
    name: 'search',
    description:
      'Search across movies, TV series, persons, users and playlists at once. ' +
      'Use it to find the id of an item before calling another tool on it. ' +
      'Returns the best overall match plus the top results of each category.',
    parameters: z.object({
      q: z.string().min(1).describe('The search query, e.g. a title or a name'),
      limit: z.number().int().min(1).max(20).default(5).describe('Number of results per category'),
    }),
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async search(
    @Payload() { q, limit }: { q: string; limit: number },
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const results = await this.searchService.search({
      currentUser: request.user,
      locale: getLocaleFromHeaders(request.headers),
      dto: { q, limit },
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(results) }],
    };
  }
}
