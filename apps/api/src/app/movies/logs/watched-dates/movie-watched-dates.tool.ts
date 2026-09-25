import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { watchFormatEnum } from '@libs/db/schemas';
import { WATCHED_DATE_RULES } from '@libs/rules';
import { z } from 'zod';
import { MovieWatchedDatesService } from './movie-watched-dates.service';
import { McpAuthenticatedRequest } from '../../../auth/types/fastify';
import { WatchedDateSortBy } from './dto/watched-dates.dto';
import { SortOrder } from '../../../../common/dto/sort.dto';

const movieIdParameter = z.number().int().describe('The TMDB id of the movie');
const watchedDateIdParameter = z.number().int().describe('The id of the watched date entry');
const watchedDateParameter = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Invalid date')
  .describe('When the movie was watched, as an ISO 8601 date or datetime');
const formatParameter = z
  .enum(watchFormatEnum.enumValues)
  .describe('The format in which the movie was watched');
const commentParameter = z
  .string()
  .min(WATCHED_DATE_RULES.COMMENT.MIN)
  .max(WATCHED_DATE_RULES.COMMENT.MAX)
  .regex(WATCHED_DATE_RULES.COMMENT.REGEX)
  .nullable()
  .describe('Optional comment about this watch');

const addWatchedDateParameters = z.object({
  movieId: movieIdParameter,
  watchedDate: watchedDateParameter,
  format: formatParameter.optional(),
  comment: commentParameter.optional(),
});

const updateWatchedDateParameters = z.object({
  movieId: movieIdParameter,
  watchedDateId: watchedDateIdParameter,
  watchedDate: watchedDateParameter.optional(),
  format: formatParameter.optional(),
  comment: commentParameter.optional(),
});

const listWatchedDatesParameters = z.object({
  movieId: movieIdParameter,
  sortOrder: z.enum(SortOrder).default(SortOrder.DESC).describe('Sort order by watched date'),
  page: z.number().int().min(1).default(1).describe('Page number'),
  perPage: z.number().int().min(1).max(50).default(10).describe('Number of results per page'),
});

@McpController()
export class MovieWatchedDatesTool {
  constructor(private readonly movieWatchedDatesService: MovieWatchedDatesService) {}

  @Tool({
    name: 'add-movie-watched-date',
    description:
      'Record one more watch of a movie at a given date (rewatch or past watch). ' +
      'The movie must already be logged: call "log-movie" first otherwise.',
    parameters: addWatchedDateParameters,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
    },
  })
  async addMovieWatchedDate(
    @Payload() { movieId, ...dto }: z.infer<typeof addWatchedDateParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const result = await this.movieWatchedDatesService.set({
      user: request.user,
      movieId,
      dto,
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result) }],
    };
  }

  @Tool({
    name: 'update-movie-watched-date',
    description: 'Update the date, format or comment of a watched date entry of a movie',
    parameters: updateWatchedDateParameters,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
  })
  async updateMovieWatchedDate(
    @Payload() { movieId, watchedDateId, ...dto }: z.infer<typeof updateWatchedDateParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const result = await this.movieWatchedDatesService.update(
      request.user,
      movieId,
      watchedDateId,
      dto,
    );

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result) }],
    };
  }

  @Tool({
    name: 'delete-movie-watched-date',
    description: 'Delete a watched date entry of a movie',
    parameters: z.object({ movieId: movieIdParameter, watchedDateId: watchedDateIdParameter }),
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
    },
  })
  async deleteMovieWatchedDate(
    @Payload() { movieId, watchedDateId }: { movieId: number; watchedDateId: number },
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const result = await this.movieWatchedDatesService.delete(request.user, movieId, watchedDateId);

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result) }],
    };
  }

  @Tool({
    name: 'list-movie-watched-dates',
    description: 'List the watch history of the current user for a movie',
    parameters: listWatchedDatesParameters,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async listMovieWatchedDates(
    @Payload() { movieId, sortOrder, page, perPage }: z.infer<typeof listWatchedDatesParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const watchedDates = await this.movieWatchedDatesService.listPaginated(request.user, movieId, {
      sort_by: WatchedDateSortBy.WATCHED_DATE,
      sort_order: sortOrder,
      page,
      per_page: perPage,
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(watchedDates) }],
    };
  }
}
