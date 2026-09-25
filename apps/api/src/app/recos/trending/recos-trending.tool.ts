import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { getLocaleFromHeaders } from '@libs/i18n';
import { z } from 'zod';
import { RecosTrendingService } from './recos-trending.service';
import { RecoTrendingSortBy } from './recos-trending.dto';
import { McpAuthenticatedRequest } from '../../auth/types/fastify';
import { SortOrder } from '../../../common/dto/sort.dto';

const listTrendingRecosParameters = z.object({
  sortBy: z
    .enum(RecoTrendingSortBy)
    .default(RecoTrendingSortBy.TRENDING_SCORE)
    .describe('Sort field'),
  sortOrder: z.enum(SortOrder).default(SortOrder.DESC).describe('Sort order'),
  page: z.number().int().min(1).default(1).describe('Page number'),
  perPage: z.number().int().min(1).max(50).default(10).describe('Number of results per page'),
});

@McpController()
export class RecosTrendingTool {
  constructor(private readonly recosTrendingService: RecosTrendingService) {}

  @Tool({
    name: 'list-trending-recos',
    description:
      'List the movies and TV series most recommended by all users over the last 30 days',
    parameters: listTrendingRecosParameters,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async listTrendingRecos(
    @Payload() { sortBy, sortOrder, page, perPage }: z.infer<typeof listTrendingRecosParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const trending = await this.recosTrendingService.listPaginated({
      query: { sort_by: sortBy, sort_order: sortOrder, page, per_page: perPage },
      locale: getLocaleFromHeaders(request.headers),
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(trending) }],
    };
  }
}
