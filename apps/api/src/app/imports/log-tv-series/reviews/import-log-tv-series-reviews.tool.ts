import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { ImportLogTvSeriesReviewsService } from './import-log-tv-series-reviews.service';
import { McpAuthenticatedRequest } from '../../../auth/types/fastify';

const updateReviewParameters = z.object({
  importId: z.number().int().describe('The id of the import'),
  itemId: z.number().int().describe('The id of the staged TV series log that carries the review'),
  resolution: z
    .enum(['keep_existing', 'use_imported'])
    .describe('"use_imported" imports the review, "keep_existing" does not import it'),
});

@McpController()
export class ImportLogTvSeriesReviewsTool {
  constructor(private readonly importLogTvSeriesReviewsService: ImportLogTvSeriesReviewsService) {}

  @Tool({
    name: 'update-import-log-tv-series-review',
    description:
      'Choose whether the review staged with a TV series log is imported. ' +
      'Only while the import is awaiting review.',
    parameters: updateReviewParameters,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
  })
  async updateImportLogTvSeriesReview(
    @Payload() { importId, itemId, resolution }: z.infer<typeof updateReviewParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const review = await this.importLogTvSeriesReviewsService.patch(
      request.user,
      importId,
      itemId,
      { resolution },
    );

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(review) }],
    };
  }
}
