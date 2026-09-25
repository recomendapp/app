import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { FollowRequestSortBy } from './dto/user-follow-requests.dto';
import { SortOrder } from '../../../common/dto/sort.dto';
import { z } from 'zod';
import { UserFollowRequestsService } from './user-follow-requests.service';
import { McpAuthenticatedRequest } from '../../auth/types/fastify';

const userFollowRequestsParameters = z.object({
  sortOrder: z.enum(SortOrder).default(SortOrder.DESC).describe('Sort order by request date'),
  page: z.number().int().min(1).default(1).describe('Page number'),
  perPage: z.number().int().min(1).max(50).default(20).describe('Number of results per page'),
});

@McpController()
export class UserFollowRequestsTool {
  constructor(private readonly userFollowRequestsService: UserFollowRequestsService) {}

  @Tool({
    name: 'list-follow-requests',
    description:
      'List the pending follow requests the current user received. ' +
      'Answer them with "accept-follow-request" or "decline-follow-request".',
    parameters: userFollowRequestsParameters,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async listFollowRequests(
    @Payload() { sortOrder, page, perPage }: z.infer<typeof userFollowRequestsParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const result = await this.userFollowRequestsService.listPaginated({
      currentUserId: request.user.id,
      query: {
        sort_by: FollowRequestSortBy.CREATED_AT,
        sort_order: sortOrder,
        page,
        per_page: perPage,
      },
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result) }],
    };
  }
}
