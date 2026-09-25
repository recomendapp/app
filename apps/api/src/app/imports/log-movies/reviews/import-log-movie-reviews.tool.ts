import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { ImportLogMovieReviewsService } from './import-log-movie-reviews.service';
import { McpAuthenticatedRequest } from '../../../auth/types/fastify';

const updateReviewParameters = z.object({
  importId: z.number().int().describe('The id of the import'),
  itemId: z.number().int().describe('The id of the staged movie log that carries the review'),
  resolution: z
    .enum(['keep_existing', 'use_imported'])
    .describe('"use_imported" imports the review, "keep_existing" does not import it'),
});

@McpController()
export class ImportLogMovieReviewsTool {
  constructor(private readonly importLogMovieReviewsService: ImportLogMovieReviewsService) {}

  @Tool({
    name: 'update-import-log-movie-review',
    description:
      'Choose whether the review staged with a movie log is imported. ' +
      'Only while the import is awaiting review.',
    parameters: updateReviewParameters,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
  })
  async updateImportLogMovieReview(
    @Payload() { importId, itemId, resolution }: z.infer<typeof updateReviewParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const review = await this.importLogMovieReviewsService.patch(request.user, importId, itemId, {
      resolution,
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(review) }],
    };
  }
}
