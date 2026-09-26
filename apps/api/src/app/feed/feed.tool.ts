import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { getLocaleFromHeaders } from '@libs/i18n';
import { feedTypeEnum } from '@libs/db/schemas';
import { z } from 'zod';
import { FeedService } from './feed.service';
import { McpAuthenticatedRequest } from '../auth/types/fastify';

const listFeedParameters = z.object({
  activityType: z
    .enum(feedTypeEnum.enumValues)
    .optional()
    .describe('Only return one type of activity'),
  page: z.number().int().min(1).default(1).describe('Page number'),
  perPage: z.number().int().min(1).max(50).default(20).describe('Number of results per page'),
});

@McpController()
export class FeedTool {
  constructor(private readonly feedService: FeedService) {}

  @Tool({
    name: 'list-feed',
    description:
      'List the recent activity of the users the current user follows: logged movies and ' +
      'TV series, liked playlists and reviews',
    parameters: listFeedParameters,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async listFeed(
    @Payload() { activityType, page, perPage }: z.infer<typeof listFeedParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const feed = await this.feedService.listPaginated({
      currentUser: request.user,
      query: { activity_type: activityType, page, per_page: perPage },
      locale: getLocaleFromHeaders(request.headers),
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(feed) }],
    };
  }
}
