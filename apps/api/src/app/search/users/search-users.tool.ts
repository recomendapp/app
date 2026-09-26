import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { SearchUsersService } from './search-users.service';
import { McpAuthenticatedRequest } from '../../auth/types/fastify';

const searchUsersParameters = z.object({
  q: z.string().min(1).describe('The search query, e.g. a username or a name'),
  page: z.number().int().min(1).default(1).describe('Page number'),
  perPage: z.number().int().min(1).max(50).default(10).describe('Number of results per page'),
});

@McpController()
export class SearchUsersTool {
  constructor(private readonly searchUsersService: SearchUsersService) {}

  @Tool({
    name: 'search-users',
    description:
      'Search users of the app by username or name. ' +
      'Prefer the "search" tool when the kind of item is unknown.',
    parameters: searchUsersParameters,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async searchUsers(
    @Payload() { q, page, perPage }: z.infer<typeof searchUsersParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const users = await this.searchUsersService.listPaginated({
      currentUser: request.user,
      dto: { q, page, per_page: perPage },
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(users) }],
    };
  }
}
