import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { MovieLogsService } from './movie-logs.service';
import { McpAuthenticatedRequest } from '../../auth/types/fastify';

const movieIdParameter = z.number().int().describe('The TMDB id of the movie');

const logMovieParameters = z.object({
  movieId: movieIdParameter,
  rating: z
    .number()
    .min(0.5)
    .max(10)
    .nullable()
    .optional()
    .describe('Rating from 0.5 to 10. Set to null to remove the rating, omit to keep it'),
  isLiked: z.boolean().optional().describe('Whether the user likes the movie, omit to keep it'),
});

@McpController()
export class MovieLogsTool {
  constructor(private readonly movieLogsService: MovieLogsService) {}

  @Tool({
    name: 'get-movie-log',
    description:
      'Get the log of the current user for a movie (rating, like, watch count, review). ' +
      'Returns null when the user never watched the movie.',
    parameters: z.object({ movieId: movieIdParameter }),
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async getMovieLog(
    @Payload() { movieId }: { movieId: number },
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const log = await this.movieLogsService.get(request.user, movieId);

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(log) }],
    };
  }

  @Tool({
    name: 'log-movie',
    description:
      'Mark a movie as watched by the current user, and optionally rate or like it. ' +
      'If the movie is already logged, only the given fields are updated. ' +
      'The first log records a watched date of today: use "add-movie-watched-date" ' +
      'to record a watch at another date. Also completes the matching bookmarks and recommendations.',
    parameters: logMovieParameters,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
  })
  async logMovie(
    @Payload() { movieId, rating, isLiked }: z.infer<typeof logMovieParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const log = await this.movieLogsService.set(request.user, movieId, { rating, isLiked });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(log) }],
    };
  }

  @Tool({
    name: 'delete-movie-log',
    description:
      'Delete the log of the current user for a movie. ' +
      'This also deletes its rating, like, watched dates and review.',
    parameters: z.object({ movieId: movieIdParameter }),
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
    },
  })
  async deleteMovieLog(
    @Payload() { movieId }: { movieId: number },
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const log = await this.movieLogsService.delete(request.user, movieId);

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(log) }],
    };
  }

  @Tool({
    name: 'get-movie-following-logs',
    description: 'Get the logs of a movie from the users the current user follows',
    parameters: z.object({
      movieId: movieIdParameter,
      hasRating: z.boolean().optional().describe('Only return logs that have a rating'),
    }),
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async getMovieFollowingLogs(
    @Payload() { movieId, hasRating }: { movieId: number; hasRating?: boolean },
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const logs = await this.movieLogsService.getFollowingLogs({
      currentUser: request.user,
      movieId,
      dto: { has_rating: hasRating },
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(logs) }],
    };
  }

  @Tool({
    name: 'get-movie-following-average-rating',
    description: 'Get the average rating of a movie from the users the current user follows',
    parameters: z.object({ movieId: movieIdParameter }),
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async getMovieFollowingAverageRating(
    @Payload() { movieId }: { movieId: number },
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const averageRating = await this.movieLogsService.getFollowingAverageRating({
      currentUser: request.user,
      movieId,
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(averageRating) }],
    };
  }
}
