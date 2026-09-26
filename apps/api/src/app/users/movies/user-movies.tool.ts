import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { getLocaleFromHeaders } from '@libs/i18n';
import { z } from 'zod';
import { UserMoviesService } from './user-movies.service';
import { LogMovieSortBy } from '../../movies/logs/log-movie.dto';
import { McpAuthenticatedRequest } from '../../auth/types/fastify';
import { SortOrder } from '../../../common/dto/sort.dto';

const userIdParameter = z
  .uuid()
  .optional()
  .describe('The id of the user. Defaults to the current user');

const getUserMovieParameters = z.object({
  userId: userIdParameter,
  movieId: z.number().int().describe('The TMDB id of the movie'),
});

const listUserMoviesParameters = z.object({
  userId: userIdParameter,
  sortBy: z.enum(LogMovieSortBy).default(LogMovieSortBy.UPDATED_AT).describe('Sort field'),
  sortOrder: z.enum(SortOrder).default(SortOrder.DESC).describe('Sort order'),
  page: z.number().int().min(1).default(1).describe('Page number'),
  perPage: z.number().int().min(1).max(50).default(20).describe('Number of results per page'),
});

@McpController()
export class UserMoviesTool {
  constructor(private readonly userMoviesService: UserMoviesService) {}

  @Tool({
    name: 'get-user-movie-log',
    description:
      'Get the log of a user for a movie (rating, like, review). ' +
      'Returns null when the user did not log it or the profile is not visible.',
    parameters: getUserMovieParameters,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async getUserMovieLog(
    @Payload() { userId, movieId }: z.infer<typeof getUserMovieParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const log = await this.userMoviesService.get({
      userId: userId ?? request.user.id,
      movieId,
      currentUser: request.user,
      locale: getLocaleFromHeaders(request.headers),
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(log) }],
    };
  }

  @Tool({
    name: 'list-user-movies',
    description: 'List the movies a user logged, with their rating and like',
    parameters: listUserMoviesParameters,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async listUserMovies(
    @Payload()
    { userId, sortBy, sortOrder, page, perPage }: z.infer<typeof listUserMoviesParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const logs = await this.userMoviesService.listPaginated({
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
