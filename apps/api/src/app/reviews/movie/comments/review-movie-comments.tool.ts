import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { REVIEW_COMMENT_RULES } from '@libs/rules';
import { z } from 'zod';
import { ReviewMovieCommentsService } from './review-movie-comments.service';
import { ReviewMovieCommentSortBy } from './dto/review-movie-comments.dto';
import { McpAuthenticatedRequest } from '../../../auth/types/fastify';
import { SortOrder } from '../../../../common/dto/sort.dto';

const reviewIdParameter = z.number().int().describe('The id of the movie review');
const commentIdParameter = z.number().int().describe('The id of the comment');
const bodyParameter = z
  .string()
  .trim()
  .min(REVIEW_COMMENT_RULES.BODY.MIN)
  .max(REVIEW_COMMENT_RULES.BODY.MAX)
  .describe('The content of the comment');

const commentParameters = z.object({
  reviewId: reviewIdParameter,
  body: bodyParameter,
  parentId: z
    .number()
    .int()
    .optional()
    .describe('The id of the top-level comment to reply to. Omit for a top-level comment'),
});

const listCommentsParameters = z.object({
  reviewId: reviewIdParameter,
  sortBy: z
    .enum(ReviewMovieCommentSortBy)
    .default(ReviewMovieCommentSortBy.CREATED_AT)
    .describe('Sort field'),
  sortOrder: z.enum(SortOrder).default(SortOrder.DESC).describe('Sort order'),
  page: z.number().int().min(1).default(1).describe('Page number'),
  perPage: z.number().int().min(1).max(50).default(20).describe('Number of results per page'),
});

const listRepliesParameters = listCommentsParameters.extend({
  commentId: commentIdParameter.describe('The id of the top-level comment'),
});

const updateCommentParameters = z.object({
  reviewId: reviewIdParameter,
  commentId: commentIdParameter,
  body: bodyParameter,
});

const deleteCommentParameters = z.object({
  reviewId: reviewIdParameter,
  commentId: commentIdParameter,
});

@McpController()
export class ReviewMovieCommentsTool {
  constructor(private readonly reviewMovieCommentsService: ReviewMovieCommentsService) {}

  @Tool({
    name: 'comment-movie-review',
    description: 'Comment on a movie review, or reply to a top-level comment of it',
    parameters: commentParameters,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
    },
  })
  async commentMovieReview(
    @Payload() { reviewId, ...dto }: z.infer<typeof commentParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const comment = await this.reviewMovieCommentsService.create({
      user: request.user,
      reviewId,
      dto,
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(comment) }],
    };
  }

  @Tool({
    name: 'list-movie-review-comments',
    description:
      'List the top-level comments of a movie review. ' +
      'Use "list-movie-review-comment-replies" for the replies of a comment.',
    parameters: listCommentsParameters,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async listMovieReviewComments(
    @Payload()
    { reviewId, sortBy, sortOrder, page, perPage }: z.infer<typeof listCommentsParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const comments = await this.reviewMovieCommentsService.listPaginated({
      reviewId,
      query: { sort_by: sortBy, sort_order: sortOrder, page, per_page: perPage },
      currentUser: request.user,
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(comments) }],
    };
  }

  @Tool({
    name: 'list-movie-review-comment-replies',
    description: 'List the replies to a top-level comment of a movie review',
    parameters: listRepliesParameters,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async listMovieReviewCommentReplies(
    @Payload()
    {
      reviewId,
      commentId,
      sortBy,
      sortOrder,
      page,
      perPage,
    }: z.infer<typeof listRepliesParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const replies = await this.reviewMovieCommentsService.listRepliesPaginated({
      reviewId,
      commentId,
      query: { sort_by: sortBy, sort_order: sortOrder, page, per_page: perPage },
      currentUser: request.user,
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(replies) }],
    };
  }

  @Tool({
    name: 'update-movie-review-comment',
    description: 'Edit a comment the current user wrote on a movie review',
    parameters: updateCommentParameters,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
  })
  async updateMovieReviewComment(
    @Payload() { reviewId, commentId, body }: z.infer<typeof updateCommentParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const comment = await this.reviewMovieCommentsService.update({
      user: request.user,
      reviewId,
      commentId,
      dto: { body },
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(comment) }],
    };
  }

  @Tool({
    name: 'delete-movie-review-comment',
    description: 'Delete a comment the current user wrote on a movie review',
    parameters: deleteCommentParameters,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
    },
  })
  async deleteMovieReviewComment(
    @Payload() { reviewId, commentId }: z.infer<typeof deleteCommentParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const comment = await this.reviewMovieCommentsService.delete({
      user: request.user,
      reviewId,
      commentId,
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(comment) }],
    };
  }
}
