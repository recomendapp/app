import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { TvSeriesLogsService } from './tv-series-logs.service';
import { McpAuthenticatedRequest } from '../../auth/types/fastify';
import { LogTvStatus } from './tv-series-logs.dto';

const tvSeriesIdParameter = z.number().int().describe('The TMDB id of the TV series');

const logTvSeriesParameters = z.object({
  tvSeriesId: tvSeriesIdParameter,
  rating: z
    .number()
    .min(0.5)
    .max(10)
    .nullable()
    .optional()
    .describe('Rating from 0.5 to 10. Set to null to remove the rating, omit to keep it'),
  isLiked: z.boolean().optional().describe('Whether the user likes the TV series, omit to keep it'),
  status: z
    .enum(LogTvStatus)
    .optional()
    .describe(
      'Watching status. "completed" marks every episode of every season (except specials) as watched',
    ),
});

@McpController()
export class TvSeriesLogsTool {
  constructor(private readonly tvSeriesLogsService: TvSeriesLogsService) {}

  @Tool({
    name: 'get-tv-series-log',
    description:
      'Get the log of the current user for a TV series (status, rating, like, progress, review). ' +
      'Returns null when the user never logged the TV series.',
    parameters: z.object({ tvSeriesId: tvSeriesIdParameter }),
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async getTvSeriesLog(
    @Payload() { tvSeriesId }: { tvSeriesId: number },
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const log = await this.tvSeriesLogsService.get({ currentUser: request.user, tvSeriesId });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(log) }],
    };
  }

  @Tool({
    name: 'log-tv-series',
    description:
      'Log a TV series for the current user, and optionally set its status, rating or like. ' +
      'If the TV series is already logged, only the given fields are updated. ' +
      'To log a single season or episode, use "log-tv-season" or "log-tv-episode". ' +
      'The first log also completes the matching bookmarks and recommendations.',
    parameters: logTvSeriesParameters,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
  })
  async logTvSeries(
    @Payload() { tvSeriesId, ...dto }: z.infer<typeof logTvSeriesParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const log = await this.tvSeriesLogsService.set({
      currentUser: request.user,
      tvSeriesId,
      dto,
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(log) }],
    };
  }

  @Tool({
    name: 'delete-tv-series-log',
    description:
      'Delete the log of the current user for a TV series. ' +
      'This also deletes its rating, like, season and episode logs, and review.',
    parameters: z.object({ tvSeriesId: tvSeriesIdParameter }),
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
    },
  })
  async deleteTvSeriesLog(
    @Payload() { tvSeriesId }: { tvSeriesId: number },
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const log = await this.tvSeriesLogsService.delete({ currentUser: request.user, tvSeriesId });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(log) }],
    };
  }

  @Tool({
    name: 'get-tv-series-following-logs',
    description: 'Get the logs of a TV series from the users the current user follows',
    parameters: z.object({
      tvSeriesId: tvSeriesIdParameter,
      hasRating: z.boolean().optional().describe('Only return logs that have a rating'),
    }),
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async getTvSeriesFollowingLogs(
    @Payload() { tvSeriesId, hasRating }: { tvSeriesId: number; hasRating?: boolean },
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const logs = await this.tvSeriesLogsService.getFollowingLogs({
      currentUser: request.user,
      tvSeriesId,
      dto: { has_rating: hasRating },
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(logs) }],
    };
  }

  @Tool({
    name: 'get-tv-series-following-average-rating',
    description: 'Get the average rating of a TV series from the users the current user follows',
    parameters: z.object({ tvSeriesId: tvSeriesIdParameter }),
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async getTvSeriesFollowingAverageRating(
    @Payload() { tvSeriesId }: { tvSeriesId: number },
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const averageRating = await this.tvSeriesLogsService.getFollowingAverageRating({
      currentUser: request.user,
      tvSeriesId,
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(averageRating) }],
    };
  }
}
