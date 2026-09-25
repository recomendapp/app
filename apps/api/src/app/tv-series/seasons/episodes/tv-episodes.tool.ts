import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { getLocaleFromHeaders } from '@libs/i18n';
import { z } from 'zod';
import { TvEpisodesService } from './tv-episodes.service';
import { McpAuthenticatedRequest } from '../../../auth/types/fastify';
import { TvEpisodeSortBy } from './tv-episodes.dto';
import { SortOrder } from '../../../../common/dto/sort.dto';

const listTvEpisodesParameters = z.object({
  tvSeriesId: z.number().int().describe('The TMDB id of the TV series'),
  seasonNumber: z.number().int().min(0).describe('The season number (0 for specials)'),
  sortBy: z.enum(TvEpisodeSortBy).default(TvEpisodeSortBy.EPISODE_NUMBER).describe('Sort field'),
  sortOrder: z.enum(SortOrder).default(SortOrder.ASC).describe('Sort order'),
});

@McpController()
export class TvEpisodesTool {
  constructor(private readonly tvEpisodesService: TvEpisodesService) {}

  @Tool({
    name: 'list-tv-season-episodes',
    description: 'List all the episodes of a season of a TV series',
    parameters: listTvEpisodesParameters,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async listTvSeasonEpisodes(
    @Payload()
    { tvSeriesId, seasonNumber, sortBy, sortOrder }: z.infer<typeof listTvEpisodesParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const episodes = await this.tvEpisodesService.listAll({
      tvSeriesId,
      seasonNumber,
      query: { sort_by: sortBy, sort_order: sortOrder },
      locale: getLocaleFromHeaders(request.headers),
      currentUser: request.user,
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(episodes) }],
    };
  }
}
