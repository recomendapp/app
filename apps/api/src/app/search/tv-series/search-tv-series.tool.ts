import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { getLocaleFromHeaders } from '@libs/i18n';
import { z } from 'zod';
import { SearchTvSeriesService } from './search-tv-series.service';
import { McpAuthenticatedRequest } from '../../auth/types/fastify';

const searchTvSeriesParameters = z.object({
  q: z.string().min(1).describe('The search query, e.g. a TV series name'),
  genreIds: z.array(z.number().int()).optional().describe('TMDB genre ids to filter by'),
  numberOfSeasonsMin: z.number().int().min(0).optional().describe('Minimum number of seasons'),
  numberOfSeasonsMax: z.number().int().min(0).optional().describe('Maximum number of seasons'),
  numberOfEpisodesMin: z.number().int().min(0).optional().describe('Minimum number of episodes'),
  numberOfEpisodesMax: z.number().int().min(0).optional().describe('Maximum number of episodes'),
  firstAirDateMin: z.iso.date().optional().describe('Minimum first air date (YYYY-MM-DD)'),
  firstAirDateMax: z.iso.date().optional().describe('Maximum first air date (YYYY-MM-DD)'),
  page: z.number().int().min(1).default(1).describe('Page number'),
  perPage: z.number().int().min(1).max(50).default(10).describe('Number of results per page'),
});

@McpController()
export class SearchTvSeriesTool {
  constructor(private readonly searchTvSeriesService: SearchTvSeriesService) {}

  @Tool({
    name: 'search-tv-series',
    description:
      'Search TV series only, with optional filters on genre, number of seasons/episodes ' +
      'and first air date. Prefer the "search" tool when the kind of item is unknown.',
    parameters: searchTvSeriesParameters,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async searchTvSeries(
    @Payload() params: z.infer<typeof searchTvSeriesParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const tvSeries = await this.searchTvSeriesService.listPaginated({
      currentUser: request.user,
      locale: getLocaleFromHeaders(request.headers),
      dto: {
        q: params.q,
        genre_ids: params.genreIds?.join(','),
        number_of_seasons_min: params.numberOfSeasonsMin,
        number_of_seasons_max: params.numberOfSeasonsMax,
        number_of_episodes_min: params.numberOfEpisodesMin,
        number_of_episodes_max: params.numberOfEpisodesMax,
        first_air_date_min: params.firstAirDateMin,
        first_air_date_max: params.firstAirDateMax,
        page: params.page,
        per_page: params.perPage,
      },
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(tvSeries) }],
    };
  }
}
