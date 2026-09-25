import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { getLocaleFromHeaders } from '@libs/i18n';
import { z } from 'zod';
import { UserTvSeriesService } from './user-tv-series.service';
import { LogTvSeriesSortBy } from '../../tv-series/logs/tv-series-logs.dto';
import { McpAuthenticatedRequest } from '../../auth/types/fastify';
import { SortOrder } from '../../../common/dto/sort.dto';

const userIdParameter = z
  .uuid()
  .optional()
  .describe('The id of the user. Defaults to the current user');

const getUserTvSeriesParameters = z.object({
  userId: userIdParameter,
  tvSeriesId: z.number().int().describe('The TMDB id of the TV series'),
});

const listUserTvSeriesParameters = z.object({
  userId: userIdParameter,
  sortBy: z.enum(LogTvSeriesSortBy).default(LogTvSeriesSortBy.UPDATED_AT).describe('Sort field'),
  sortOrder: z.enum(SortOrder).default(SortOrder.DESC).describe('Sort order'),
  page: z.number().int().min(1).default(1).describe('Page number'),
  perPage: z.number().int().min(1).max(50).default(20).describe('Number of results per page'),
});

@McpController()
export class UserTvSeriesTool {
  constructor(private readonly userTvSeriesService: UserTvSeriesService) {}

  @Tool({
    name: 'get-user-tv-series-log',
    description:
      'Get the log of a user for a TV series (rating, like, review). ' +
      'Returns null when the user did not log it or the profile is not visible.',
    parameters: getUserTvSeriesParameters,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async getUserTvSeriesLog(
    @Payload() { userId, tvSeriesId }: z.infer<typeof getUserTvSeriesParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const log = await this.userTvSeriesService.get({
      userId: userId ?? request.user.id,
      tvSeriesId,
      currentUser: request.user,
      locale: getLocaleFromHeaders(request.headers),
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(log) }],
    };
  }

  @Tool({
    name: 'list-user-tv-series',
    description: 'List the TV series a user logged, with their rating and like',
    parameters: listUserTvSeriesParameters,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async listUserTvSeries(
    @Payload()
    { userId, sortBy, sortOrder, page, perPage }: z.infer<typeof listUserTvSeriesParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const logs = await this.userTvSeriesService.listPaginated({
      userId: userId ?? request.user.id,
      query: { sort_by: sortBy, sort_order: sortOrder, page, per_page: perPage },
      currentUser: request.user,
      locale: getLocaleFromHeaders(request.headers),
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(logs) }],
    };
  }
}
