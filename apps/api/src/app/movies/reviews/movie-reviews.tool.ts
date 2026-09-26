import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { REVIEW_RULES } from '@libs/rules';
import { z } from 'zod';
import { MovieReviewsService } from './movie-reviews.service';
import { McpAuthenticatedRequest } from '../../auth/types/fastify';
import { ReviewMovieSortBy } from '../../reviews/movie/dto/reviews-movie.dto';
import { SortOrder } from '../../../common/dto/sort.dto';

const movieIdParameter = z.number().int().describe('The TMDB id of the movie');

const upsertReviewParameters = z.object({
  movieId: movieIdParameter,
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
  movieId: movieIdParameter,
  sortBy: z.enum(ReviewMovieSortBy).default(ReviewMovieSortBy.CREATED_AT).describe('Sort field'),
  sortOrder: z.enum(SortOrder).default(SortOrder.DESC).describe('Sort order'),
  page: z.number().int().min(1).default(1).describe('Page number'),
  perPage: z.number().int().min(1).max(50).default(10).describe('Number of results per page'),
});

@McpController()
export class MovieReviewsTool {
  constructor(private readonly movieReviewsService: MovieReviewsService) {}

  @Tool({
    name: 'upsert-movie-review',
    description:
      'Create or replace the review of the current user for a movie. ' +
      'The movie must already be logged: call "log-movie" first otherwise. ' +
      'The rating is not part of the review: set it with "log-movie".',
    parameters: upsertReviewParameters,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
    },
  })
  async upsertMovieReview(
    @Payload() { movieId, ...dto }: z.infer<typeof upsertReviewParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const review = await this.movieReviewsService.upsert({
      user: request.user,
      movieId,
      dto,
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(review) }],
    };
  }

  @Tool({
    name: 'delete-movie-review',
    description: 'Delete the review of the current user for a movie. The log and rating are kept.',
    parameters: z.object({ movieId: movieIdParameter }),
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
    },
  })
  async deleteMovieReview(
    @Payload() { movieId }: { movieId: number },
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const review = await this.movieReviewsService.delete({ user: request.user, movieId });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(review) }],
    };
  }

  @Tool({
    name: 'list-movie-reviews',
    description: 'List the reviews of a movie visible to the current user',
    parameters: listReviewsParameters,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async listMovieReviews(
    @Payload() { movieId, sortBy, sortOrder, page, perPage }: z.infer<typeof listReviewsParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const reviews = await this.movieReviewsService.listPaginated({
      movieId,
      currentUser: request.user,
      query: { sort_by: sortBy, sort_order: sortOrder, page, per_page: perPage },
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(reviews) }],
    };
  }
}
