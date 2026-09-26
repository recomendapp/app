import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { getLocaleFromHeaders } from '@libs/i18n';
import { z } from 'zod';
import { TvSeasonsService } from './tv-seasons.service';
import { McpAuthenticatedRequest } from '../../auth/types/fastify';

const getTvSeasonParameters = z.object({
  tvSeriesId: z.number().int().describe('The TMDB id of the TV series'),
  seasonNumber: z.number().int().min(0).describe('The season number (0 for specials)'),
});

@McpController()
export class TvSeasonsTool {
  constructor(private readonly tvSeasonsService: TvSeasonsService) {}

  @Tool({
    name: 'get-tv-season',
    description: 'Get the details of a season of a TV series',
    parameters: getTvSeasonParameters,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async getTvSeason(
    @Payload() { tvSeriesId, seasonNumber }: z.infer<typeof getTvSeasonParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const season = await this.tvSeasonsService.get({
      tvSeriesId,
      seasonNumber,
      currentUser: request.user,
      locale: getLocaleFromHeaders(request.headers),
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(season) }],
    };
  }
}
