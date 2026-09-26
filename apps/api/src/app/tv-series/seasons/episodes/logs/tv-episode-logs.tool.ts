import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { TvEpisodeLogsService } from './tv-episode-logs.service';
import { McpAuthenticatedRequest } from '../../../../auth/types/fastify';

const tvEpisodeParameters = z.object({
  tvSeriesId: z.number().int().describe('The TMDB id of the TV series'),
  seasonNumber: z.number().int().min(0).describe('The season number (0 for specials)'),
  episodeNumber: z.number().int().min(0).describe('The episode number in the season'),
});

const logTvEpisodeParameters = tvEpisodeParameters.extend({
  rating: z
    .number()
    .min(0.5)
    .max(10)
    .nullable()
    .optional()
    .describe('Rating from 0.5 to 10. Set to null to remove the rating, omit to keep it'),
});

@McpController()
export class TvEpisodeLogsTool {
  constructor(private readonly tvEpisodeLogsService: TvEpisodeLogsService) {}

  @Tool({
    name: 'get-tv-episode-log',
    description:
      'Get the log of the current user for an episode of a TV series. ' +
      'Returns null when the user never watched the episode.',
    parameters: tvEpisodeParameters,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async getTvEpisodeLog(
    @Payload() params: z.infer<typeof tvEpisodeParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const log = await this.tvEpisodeLogsService.get({ currentUser: request.user, ...params });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(log) }],
    };
  }

  @Tool({
    name: 'log-tv-episode',
    description:
      'Mark an episode of a TV series as watched now by the current user, and optionally rate it. ' +
      'Also logs the season and the TV series when needed. ' +
      'Returns the episode log with the updated season and TV series logs.',
    parameters: logTvEpisodeParameters,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
    },
  })
  async logTvEpisode(
    @Payload()
    { tvSeriesId, seasonNumber, episodeNumber, ...dto }: z.infer<typeof logTvEpisodeParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const result = await this.tvEpisodeLogsService.set({
      currentUser: request.user,
      tvSeriesId,
      seasonNumber,
      episodeNumber,
      dto,
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result) }],
    };
  }

  @Tool({
    name: 'delete-tv-episode-log',
    description:
      'Delete the log of the current user for an episode of a TV series. ' +
      'Returns the updated season and TV series logs.',
    parameters: tvEpisodeParameters,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
    },
  })
  async deleteTvEpisodeLog(
    @Payload() params: z.infer<typeof tvEpisodeParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const result = await this.tvEpisodeLogsService.delete({ currentUser: request.user, ...params });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result) }],
    };
  }
}
