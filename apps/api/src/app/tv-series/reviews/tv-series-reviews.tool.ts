import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { REVIEW_RULES } from '@libs/rules';
import { z } from 'zod';
import { TvSeriesReviewsService } from './tv-series-reviews.service';
import { McpAuthenticatedRequest } from '../../auth/types/fastify';
import { ReviewTvSeriesSortBy } from '../../reviews/tv-series/dto/review-tv-series.dto';
import { SortOrder } from '../../../common/dto/sort.dto';

const tvSeriesIdParameter = z.number().int().describe('The TMDB id of the TV series');

const upsertReviewParameters = z.object({
  tvSeriesId: tvSeriesIdParameter,
  title: z
    .string()
    .min(REVIEW_RULES.TITLE.MIN)
    .max(REVIEW_RULES.TITLE.MAX)
    .nullable()
    .default(null)
    .describe('Optional title of the review'),
  body: z
    .string()
    .trim()
    .min(REVIEW_RULES.BODY.MIN)
    .max(REVIEW_RULES.BODY.MAX)
    .describe('The review content, in Markdown'),
  isSpoiler: z.boolean().default(false).describe('Whether the review contains spoilers'),
});

const listReviewsParameters = z.object({
  tvSeriesId: tvSeriesIdParameter,
  sortBy: z
    .enum(ReviewTvSeriesSortBy)
    .default(ReviewTvSeriesSortBy.CREATED_AT)
    .describe('Sort field'),
  sortOrder: z.enum(SortOrder).default(SortOrder.DESC).describe('Sort order'),
  page: z.number().int().min(1).default(1).describe('Page number'),
  perPage: z.number().int().min(1).max(50).default(10).describe('Number of results per page'),
});

@McpController()
export class TvSeriesReviewsTool {
  constructor(private readonly tvSeriesReviewsService: TvSeriesReviewsService) {}

  @Tool({
    name: 'upsert-tv-series-review',
    description:
      'Create or replace the review of the current user for a TV series. ' +
      'The TV series must already be logged: call "log-tv-series" first otherwise. ' +
      'The rating is not part of the review: set it with "log-tv-series".',
    parameters: upsertReviewParameters,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
    },
  })
  async upsertTvSeriesReview(
    @Payload() { tvSeriesId, ...dto }: z.infer<typeof upsertReviewParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const review = await this.tvSeriesReviewsService.upsert({
      user: request.user,
      tvSeriesId,
      dto,
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(review) }],
    };
  }

  @Tool({
    name: 'delete-tv-series-review',
    description:
      'Delete the review of the current user for a TV series. The log and rating are kept.',
    parameters: z.object({ tvSeriesId: tvSeriesIdParameter }),
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
    },
  })
  async deleteTvSeriesReview(
    @Payload() { tvSeriesId }: { tvSeriesId: number },
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const review = await this.tvSeriesReviewsService.delete({ user: request.user, tvSeriesId });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(review) }],
    };
  }

  @Tool({
    name: 'list-tv-series-reviews',
    description: 'List the reviews of a TV series visible to the current user',
    parameters: listReviewsParameters,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async listTvSeriesReviews(
    @Payload()
    { tvSeriesId, sortBy, sortOrder, page, perPage }: z.infer<typeof listReviewsParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const reviews = await this.tvSeriesReviewsService.listPaginated({
      tvSeriesId,
      currentUser: request.user,
      query: { sort_by: sortBy, sort_order: sortOrder, page, per_page: perPage },
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(reviews) }],
    };
  }
}
