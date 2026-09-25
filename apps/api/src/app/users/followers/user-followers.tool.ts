import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { UserSortBy } from '../dto/users.dto';
import { SortOrder } from '../../../common/dto/sort.dto';
import { z } from 'zod';
import { UserFollowersService } from './user-followers.service';
import { McpAuthenticatedRequest } from '../../auth/types/fastify';

const userFollowersParameters = z.object({
  userId: z.uuid().optional().describe('The id of the user. Defaults to the current user'),
  sortBy: z.enum(UserSortBy).default(UserSortBy.CREATED_AT).describe('Sort field'),
  sortOrder: z.enum(SortOrder).default(SortOrder.DESC).describe('Sort order'),
  page: z.number().int().min(1).default(1).describe('Page number'),
  perPage: z.number().int().min(1).max(50).default(20).describe('Number of results per page'),
});

@McpController()
export class UserFollowersTool {
  constructor(private readonly userFollowersService: UserFollowersService) {}

  @Tool({
    name: 'list-user-followers',
    description:
      'List the followers of a user. Hidden when the profile is private and not followed.',
    parameters: userFollowersParameters,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async listUserFollowers(
    @Payload()
    { userId, sortBy, sortOrder, page, perPage }: z.infer<typeof userFollowersParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const result = await this.userFollowersService.listPaginated({
      targetUserId: userId ?? request.user.id,
      query: { sort_by: sortBy, sort_order: sortOrder, page, per_page: perPage },
      currentUser: request.user,
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result) }],
    };
  }
}
