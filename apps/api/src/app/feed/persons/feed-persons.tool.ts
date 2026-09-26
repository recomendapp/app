import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { getLocaleFromHeaders } from '@libs/i18n';
import { z } from 'zod';
import { FeedPersonsService } from './feed-persons.service';
import { PersonFeedSortBy } from '../../persons/feed/dto/person-feed.dto';
import { McpAuthenticatedRequest } from '../../auth/types/fastify';
import { SortOrder } from '../../../common/dto/sort.dto';

const listPersonFeedParameters = z.object({
  minDate: z.iso
    .date()
    .optional()
    .describe('Only return releases from this date (YYYY-MM-DD). Defaults to 7 days ago'),
  maxDate: z.iso.date().optional().describe('Only return releases up to this date (YYYY-MM-DD)'),
  sortOrder: z.enum(SortOrder).default(SortOrder.ASC).describe('Sort order by release date'),
  page: z.number().int().min(1).default(1).describe('Page number'),
  perPage: z.number().int().min(1).max(50).default(20).describe('Number of results per page'),
});

@McpController()
export class FeedPersonsTool {
  constructor(private readonly feedPersonsService: FeedPersonsService) {}

  @Tool({
    name: 'list-person-feed',
    description:
      'List the movies and TV series recently released by the persons the current user ' +
      'follows (see "follow-person"). Premium only.',
    parameters: listPersonFeedParameters,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async listPersonFeed(
    @Payload()
    { minDate, maxDate, sortOrder, page, perPage }: z.infer<typeof listPersonFeedParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const feed = await this.feedPersonsService.listPaginated({
      currentUser: request.user,
      query: {
        sort_by: PersonFeedSortBy.DATE,
        sort_order: sortOrder,
        // Same default as ListPaginatedPersonFeedQueryDto, whose initializer only runs over HTTP.
        min_date:
          minDate ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        max_date: maxDate,
        page,
        per_page: perPage,
      },
      locale: getLocaleFromHeaders(request.headers),
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(feed) }],
    };
  }
}
