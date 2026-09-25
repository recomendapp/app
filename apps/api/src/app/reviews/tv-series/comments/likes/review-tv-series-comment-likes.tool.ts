import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { ReviewTvSeriesCommentLikesService } from './review-tv-series-comment-likes.service';
import { McpAuthenticatedRequest } from '../../../../auth/types/fastify';

const targetParameters = z.object({
  reviewId: z.number().int().describe('The id of the TV series review'),
  commentId: z.number().int().describe('The id of the comment'),
});

const listLikesParameters = targetParameters.extend({
  page: z.number().int().min(1).default(1).describe('Page number'),
  perPage: z.number().int().min(1).max(50).default(20).describe('Number of results per page'),
});

@McpController()
export class ReviewTvSeriesCommentLikesTool {
  constructor(
    private readonly reviewTvSeriesCommentLikesService: ReviewTvSeriesCommentLikesService,
  ) {}

  @Tool({
    name: 'get-tv-series-review-comment-like',
    description: 'Check whether the current user liked a comment on a TV series review',
    parameters: targetParameters,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async getTvSeriesReviewCommentLike(
    @Payload() target: z.infer<typeof targetParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const isLiked = await this.reviewTvSeriesCommentLikesService.getLike({
      user: request.user,
      ...target,
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ isLiked }) }],
    };
  }

  @Tool({
    name: 'like-tv-series-review-comment',
    description: 'Like a comment on a TV series review',
    parameters: targetParameters,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
  })
  async likeTvSeriesReviewComment(
    @Payload() target: z.infer<typeof targetParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const like = await this.reviewTvSeriesCommentLikesService.like({
      user: request.user,
      ...target,
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(like) }],
    };
  }

  @Tool({
    name: 'unlike-tv-series-review-comment',
    description: 'Remove the like of the current user from a comment on a TV series review',
    parameters: targetParameters,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
    },
  })
  async unlikeTvSeriesReviewComment(
    @Payload() target: z.infer<typeof targetParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const like = await this.reviewTvSeriesCommentLikesService.unlike({
      user: request.user,
      ...target,
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(like) }],
    };
  }

  @Tool({
    name: 'list-tv-series-review-comment-likes',
    description: 'List the users who liked a comment on a TV series review',
    parameters: listLikesParameters,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async listTvSeriesReviewCommentLikes(
    @Payload() { page, perPage, ...target }: z.infer<typeof listLikesParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const likes = await this.reviewTvSeriesCommentLikesService.listPaginated({
      ...target,
      query: { page, per_page: perPage },
      currentUser: request.user,
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(likes) }],
    };
  }
}
