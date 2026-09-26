import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { ReviewMovieLikesService } from './review-movie-likes.service';
import { McpAuthenticatedRequest } from '../../../auth/types/fastify';

const targetParameters = z.object({
  reviewId: z.number().int().describe('The id of the movie review'),
});

const listLikesParameters = targetParameters.extend({
  page: z.number().int().min(1).default(1).describe('Page number'),
  perPage: z.number().int().min(1).max(50).default(20).describe('Number of results per page'),
});

@McpController()
export class ReviewMovieLikesTool {
  constructor(private readonly reviewMovieLikesService: ReviewMovieLikesService) {}

  @Tool({
    name: 'get-movie-review-like',
    description: 'Check whether the current user liked a movie review',
    parameters: targetParameters,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async getMovieReviewLike(
    @Payload() target: z.infer<typeof targetParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const isLiked = await this.reviewMovieLikesService.getLike({ user: request.user, ...target });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ isLiked }) }],
    };
  }

  @Tool({
    name: 'like-movie-review',
    description: 'Like a movie review',
    parameters: targetParameters,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
  })
  async likeMovieReview(
    @Payload() target: z.infer<typeof targetParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const like = await this.reviewMovieLikesService.like({ user: request.user, ...target });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(like) }],
    };
  }

  @Tool({
    name: 'unlike-movie-review',
    description: 'Remove the like of the current user from a movie review',
    parameters: targetParameters,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
    },
  })
  async unlikeMovieReview(
    @Payload() target: z.infer<typeof targetParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const like = await this.reviewMovieLikesService.unlike({ user: request.user, ...target });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(like) }],
    };
  }

  @Tool({
    name: 'list-movie-review-likes',
    description: 'List the users who liked a movie review',
    parameters: listLikesParameters,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async listMovieReviewLikes(
    @Payload() { page, perPage, ...target }: z.infer<typeof listLikesParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const likes = await this.reviewMovieLikesService.listPaginated({
      ...target,
      query: { page, per_page: perPage },
      currentUser: request.user,
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(likes) }],
    };
  }
}
