import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { getLocaleFromHeaders } from '@libs/i18n';
import { feedTypeEnum } from '@libs/db/schemas';
import { z } from 'zod';
import { FeedService } from '../../feed/feed.service';
import { McpAuthenticatedRequest } from '../../auth/types/fastify';

const userFeedParameters = z.object({
  userId: z.uuid().optional().describe('The id of the user. Defaults to the current user'),
  activityType: z
    .enum(feedTypeEnum.enumValues)
    .optional()
    .describe('Only return one type of activity'),
  page: z.number().int().min(1).default(1).describe('Page number'),
  perPage: z.number().int().min(1).max(50).default(20).describe('Number of results per page'),
});

@McpController()
export class UserFeedTool {
  constructor(private readonly feedService: FeedService) {}

  @Tool({
    name: 'list-user-activity',
    description:
      'List the recent activity of a user: logged movies and TV series, liked playlists and reviews',
    parameters: userFeedParameters,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async listUserActivity(
    @Payload() { userId, activityType, page, perPage }: z.infer<typeof userFeedParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const result = await this.feedService.listPaginated({
      targetUserId: userId ?? request.user.id,
      query: { activity_type: activityType, page, per_page: perPage },
      currentUser: request.user,
      locale: getLocaleFromHeaders(request.headers),
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result) }],
    };
  }
}
