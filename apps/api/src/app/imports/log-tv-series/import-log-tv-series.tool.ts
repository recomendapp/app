import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { getLocaleFromHeaders } from '@libs/i18n';
import { z } from 'zod';
import { ImportLogTvSeriesService } from './import-log-tv-series.service';
import { McpAuthenticatedRequest } from '../../auth/types/fastify';

const listParameters = z.object({
  importId: z.number().int().describe('The id of the import'),
  page: z.number().int().min(1).default(1).describe('Page number'),
  perPage: z.number().int().min(1).max(50).default(20).describe('Number of results per page'),
});

const updateParameters = z.object({
  importId: z.number().int().describe('The id of the import'),
  itemId: z.number().int().describe('The id of the staged TV series log (not a TMDB id)'),
  tvSeriesId: z.number().int().optional().describe('The TMDB id of the right TV series'),
  resolution: z
    .enum(['keep_existing', 'use_imported', 'merge'])
    .optional()
    .describe(
      'When the user already logged it: "keep_existing" keeps the current rating, ' +
        '"use_imported" takes the imported one, "merge" only fills a missing rating',
    ),
  matchStatus: z
    .enum(['skipped', 'unmatched'])
    .optional()
    .describe(
      '"skipped" excludes the item from the import, "unmatched" restores a skipped item. ' +
        'An item becomes matched by giving it a TMDB id',
    ),
});

@McpController()
export class ImportLogTvSeriesTool {
  constructor(private readonly importLogTvSeriesService: ImportLogTvSeriesService) {}

  @Tool({
    name: 'list-import-log-tv-series',
    description:
      'List the TV series logs staged by an import, with their match and imported rating, like, status and review',
    parameters: listParameters,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async listImportLogTvSeries(
    @Payload() { importId, page, perPage }: z.infer<typeof listParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const items = await this.importLogTvSeriesService.listPaginated(
      request.user,
      importId,
      { page, per_page: perPage },
      getLocaleFromHeaders(request.headers),
    );

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(items) }],
    };
  }

  @Tool({
    name: 'update-import-log-tv-series',
    description:
      'Fix the match of a staged TV series log with a TMDB id, or skip it. ' +
      'Only while the import is awaiting review.',
    parameters: updateParameters,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
  })
  async updateImportLogTvSeriesItem(
    @Payload() { importId, itemId, ...dto }: z.infer<typeof updateParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const item = await this.importLogTvSeriesService.patch(
      request.user,
      importId,
      itemId,
      dto,
      getLocaleFromHeaders(request.headers),
    );

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(item) }],
    };
  }
}
