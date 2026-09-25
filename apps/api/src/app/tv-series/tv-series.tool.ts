import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { getLocaleFromHeaders } from '@libs/i18n';
import { z } from 'zod';
import { TvSeriesService } from './tv-series.service';
import { McpAuthenticatedRequest } from '../auth/types/fastify';

const tvSeriesIdParameter = z.object({
  tvSeriesId: z.number().int().describe('The TMDB id of the TV series'),
});

@McpController()
export class TvSeriesTool {
  constructor(private readonly tvSeriesService: TvSeriesService) {}

  @Tool({
    name: 'get-tv-series',
    description: 'Get the details of a TV series by its TMDB id',
    parameters: tvSeriesIdParameter,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async getTvSeries(
    @Payload() { tvSeriesId }: { tvSeriesId: number },
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const tvSeries = await this.tvSeriesService.get({
      tvSeriesId,
      currentUser: request.user,
      locale: getLocaleFromHeaders(request.headers),
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(tvSeries) }],
    };
  }

  @Tool({
    name: 'get-tv-series-seasons',
    description: 'List the seasons of a TV series',
    parameters: tvSeriesIdParameter,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async getTvSeriesSeasons(
    @Payload() { tvSeriesId }: { tvSeriesId: number },
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const seasons = await this.tvSeriesService.getSeasons({
      tvSeriesId,
      locale: getLocaleFromHeaders(request.headers),
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(seasons) }],
    };
  }

  @Tool({
    name: 'get-tv-series-casting',
    description: 'Get the cast of a TV series',
    parameters: tvSeriesIdParameter,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async getTvSeriesCasting(
    @Payload() { tvSeriesId }: { tvSeriesId: number },
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const casting = await this.tvSeriesService.getCasting({
      tvSeriesId,
      locale: getLocaleFromHeaders(request.headers),
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(casting) }],
    };
  }
}
