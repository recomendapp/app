import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { ReviewTvSeriesLikesService } from './review-tv-series-likes.service';
import { McpAuthenticatedRequest } from '../../../auth/types/fastify';

const targetParameters = z.object({
  reviewId: z.number().int().describe('The id of the TV series review'),
});

const listLikesParameters = targetParameters.extend({
  page: z.number().int().min(1).default(1).describe('Page number'),
  perPage: z.number().int().min(1).max(50).default(20).describe('Number of results per page'),
});

@McpController()
export class ReviewTvSeriesLikesTool {
  constructor(private readonly reviewTvSeriesLikesService: ReviewTvSeriesLikesService) {}

  @Tool({
    name: 'get-tv-series-review-like',
    description: 'Check whether the current user liked a TV series review',
    parameters: targetParameters,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async getTvSeriesReviewLike(
    @Payload() target: z.infer<typeof targetParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const isLiked = await this.reviewTvSeriesLikesService.getLike({
      user: request.user,
      ...target,
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ isLiked }) }],
    };
  }

  @Tool({
    name: 'like-tv-series-review',
    description: 'Like a TV series review',
    parameters: targetParameters,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
  })
  async likeTvSeriesReview(
    @Payload() target: z.infer<typeof targetParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const like = await this.reviewTvSeriesLikesService.like({ user: request.user, ...target });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(like) }],
    };
  }

  @Tool({
    name: 'unlike-tv-series-review',
    description: 'Remove the like of the current user from a TV series review',
    parameters: targetParameters,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
    },
  })
  async unlikeTvSeriesReview(
    @Payload() target: z.infer<typeof targetParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const like = await this.reviewTvSeriesLikesService.unlike({ user: request.user, ...target });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(like) }],
    };
  }

  @Tool({
    name: 'list-tv-series-review-likes',
    description: 'List the users who liked a TV series review',
    parameters: listLikesParameters,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async listTvSeriesReviewLikes(
    @Payload() { page, perPage, ...target }: z.infer<typeof listLikesParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const likes = await this.reviewTvSeriesLikesService.listPaginated({
      ...target,
      query: { page, per_page: perPage },
      currentUser: request.user,
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(likes) }],
    };
  }
}
