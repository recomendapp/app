import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { TvSeasonLogsService } from './tv-season-logs.service';
import { McpAuthenticatedRequest } from '../../../auth/types/fastify';
import { LogTvStatus } from '../../logs/tv-series-logs.dto';

const tvSeasonParameters = z.object({
  tvSeriesId: z.number().int().describe('The TMDB id of the TV series'),
  seasonNumber: z.number().int().min(0).describe('The season number (0 for specials)'),
});

const logTvSeasonParameters = tvSeasonParameters.extend({
  rating: z
    .number()
    .min(0.5)
    .max(10)
    .nullable()
    .optional()
    .describe('Rating from 0.5 to 10. Set to null to remove the rating, omit to keep it'),
  status: z
    .enum(LogTvStatus)
    .optional()
    .describe('Watching status. "completed" marks every episode of the season as watched'),
});

@McpController()
export class TvSeasonLogsTool {
  constructor(private readonly tvSeasonLogsService: TvSeasonLogsService) {}

  @Tool({
    name: 'get-tv-season-log',
    description:
      'Get the log of the current user for a season of a TV series (status, rating, progress). ' +
      'Returns null when the user never logged the season.',
    parameters: tvSeasonParameters,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async getTvSeasonLog(
    @Payload() { tvSeriesId, seasonNumber }: z.infer<typeof tvSeasonParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const log = await this.tvSeasonLogsService.get({
      currentUser: request.user,
      tvSeriesId,
      seasonNumber,
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(log) }],
    };
  }

  @Tool({
    name: 'log-tv-season',
    description:
      'Log a season of a TV series for the current user, and optionally set its status or rating. ' +
      'Also logs the TV series when needed. Returns the season log and the updated TV series log.',
    parameters: logTvSeasonParameters,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
  })
  async logTvSeason(
    @Payload() { tvSeriesId, seasonNumber, ...dto }: z.infer<typeof logTvSeasonParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const result = await this.tvSeasonLogsService.set({
      currentUser: request.user,
      tvSeriesId,
      seasonNumber,
      dto,
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result) }],
    };
  }

  @Tool({
    name: 'delete-tv-season-log',
    description:
      'Delete the log of the current user for a season of a TV series, ' +
      'including its episode logs. Returns the updated TV series log.',
    parameters: tvSeasonParameters,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
    },
  })
  async deleteTvSeasonLog(
    @Payload() { tvSeriesId, seasonNumber }: z.infer<typeof tvSeasonParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const result = await this.tvSeasonLogsService.delete({
      currentUser: request.user,
      tvSeriesId,
      seasonNumber,
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result) }],
    };
  }
}
