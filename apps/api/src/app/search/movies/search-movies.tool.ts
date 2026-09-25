import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { getLocaleFromHeaders } from '@libs/i18n';
import { z } from 'zod';
import { SearchMoviesService } from './search-movies.service';
import { McpAuthenticatedRequest } from '../../auth/types/fastify';

const searchMoviesParameters = z.object({
  q: z.string().min(1).describe('The search query, e.g. a movie title'),
  genreIds: z.array(z.number().int()).optional().describe('TMDB genre ids to filter by'),
  runtimeMin: z.number().int().min(0).optional().describe('Minimum runtime in minutes'),
  runtimeMax: z.number().int().min(0).optional().describe('Maximum runtime in minutes'),
  releaseDateMin: z.iso.date().optional().describe('Minimum release date (YYYY-MM-DD)'),
  releaseDateMax: z.iso.date().optional().describe('Maximum release date (YYYY-MM-DD)'),
  page: z.number().int().min(1).default(1).describe('Page number'),
  perPage: z.number().int().min(1).max(50).default(10).describe('Number of results per page'),
});

@McpController()
export class SearchMoviesTool {
  constructor(private readonly searchMoviesService: SearchMoviesService) {}

  @Tool({
    name: 'search-movies',
    description:
      'Search movies only, with optional filters on genre, runtime and release date. ' +
      'Prefer the "search" tool when the kind of item is unknown.',
    parameters: searchMoviesParameters,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async searchMovies(
    @Payload() params: z.infer<typeof searchMoviesParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const movies = await this.searchMoviesService.listPaginated({
      currentUser: request.user,
      locale: getLocaleFromHeaders(request.headers),
      dto: {
        q: params.q,
        genre_ids: params.genreIds?.join(','),
        runtime_min: params.runtimeMin,
        runtime_max: params.runtimeMax,
        release_date_min: params.releaseDateMin,
        release_date_max: params.releaseDateMax,
        page: params.page,
        per_page: params.perPage,
      },
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(movies) }],
    };
  }
}
