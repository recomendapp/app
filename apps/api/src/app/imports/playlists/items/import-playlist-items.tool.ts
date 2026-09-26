import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { getLocaleFromHeaders } from '@libs/i18n';
import { z } from 'zod';
import { ImportPlaylistItemsService } from './import-playlist-items.service';
import { McpAuthenticatedRequest } from '../../../auth/types/fastify';

const listParameters = z.object({
  importId: z.number().int().describe('The id of the import'),
  playlistId: z
    .number()
    .int()
    .describe('The id of the staged playlist (see "list-import-playlists")'),
  page: z.number().int().min(1).default(1).describe('Page number'),
  perPage: z.number().int().min(1).max(50).default(20).describe('Number of results per page'),
});

const updateParameters = z.object({
  importId: z.number().int().describe('The id of the import'),
  playlistId: z
    .number()
    .int()
    .describe('The id of the staged playlist (see "list-import-playlists")'),
  itemId: z.number().int().describe('The id of the staged playlist item (not a TMDB id)'),
  movieId: z.number().int().optional().describe('The TMDB id of the right movie'),
  tvSeriesId: z.number().int().optional().describe('The TMDB id of the right TV series'),
  matchStatus: z
    .enum(['skipped', 'unmatched'])
    .optional()
    .describe(
      '"skipped" excludes the item from the import, "unmatched" restores a skipped item. ' +
        'An item becomes matched by giving it a TMDB id',
    ),
});

@McpController()
export class ImportPlaylistItemsTool {
  constructor(private readonly importPlaylistItemsService: ImportPlaylistItemsService) {}

  @Tool({
    name: 'list-import-playlist-items',
    description: 'List the items of a playlist staged by an import, with their match',
    parameters: listParameters,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async listImportPlaylistItems(
    @Payload() { importId, playlistId, page, perPage }: z.infer<typeof listParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const items = await this.importPlaylistItemsService.listPaginated(
      request.user,
      importId,
      playlistId,
      { page, per_page: perPage },
      getLocaleFromHeaders(request.headers),
    );

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(items) }],
    };
  }

  @Tool({
    name: 'update-import-playlist-item',
    description:
      'Fix the match of a staged playlist item with a TMDB id, or skip it. ' +
      'Only while the import is awaiting review.',
    parameters: updateParameters,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
  })
  async updateImportPlaylistItem(
    @Payload() { importId, playlistId, itemId, ...dto }: z.infer<typeof updateParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const item = await this.importPlaylistItemsService.patch(
      request.user,
      importId,
      playlistId,
      itemId,
      dto,
      getLocaleFromHeaders(request.headers),
    );

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(item) }],
    };
  }
}
