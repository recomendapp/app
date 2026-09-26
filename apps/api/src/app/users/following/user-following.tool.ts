import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { UserSortBy } from '../dto/users.dto';
import { SortOrder } from '../../../common/dto/sort.dto';
import { z } from 'zod';
import { UserFollowingService } from './user-following.service';
import { McpAuthenticatedRequest } from '../../auth/types/fastify';

const userFollowingParameters = z.object({
  userId: z.uuid().optional().describe('The id of the user. Defaults to the current user'),
  sortBy: z.enum(UserSortBy).default(UserSortBy.CREATED_AT).describe('Sort field'),
  sortOrder: z.enum(SortOrder).default(SortOrder.DESC).describe('Sort order'),
  page: z.number().int().min(1).default(1).describe('Page number'),
  perPage: z.number().int().min(1).max(50).default(20).describe('Number of results per page'),
});

@McpController()
export class UserFollowingTool {
  constructor(private readonly userFollowingService: UserFollowingService) {}

  @Tool({
    name: 'list-user-following',
    description:
      'List the users a user follows. Hidden when the profile is private and not followed.',
    parameters: userFollowingParameters,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async listUserFollowing(
    @Payload()
    { userId, sortBy, sortOrder, page, perPage }: z.infer<typeof userFollowingParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const result = await this.userFollowingService.listPaginated({
      targetUserId: userId ?? request.user.id,
      query: { sort_by: sortBy, sort_order: sortOrder, page, per_page: perPage },
      currentUser: request.user,
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result) }],
    };
  }
}
