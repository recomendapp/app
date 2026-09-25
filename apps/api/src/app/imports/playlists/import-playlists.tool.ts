import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { ImportPlaylistsService } from './import-playlists.service';
import { McpAuthenticatedRequest } from '../../auth/types/fastify';

const listParameters = z.object({
  importId: z.number().int().describe('The id of the import'),
  page: z.number().int().min(1).default(1).describe('Page number'),
  perPage: z.number().int().min(1).max(50).default(20).describe('Number of results per page'),
});

const updateParameters = z.object({
  importId: z.number().int().describe('The id of the import'),
  itemId: z.number().int().describe('The id of the staged playlist (not a TMDB id)'),
  matchStatus: z
    .enum(['skipped', 'matched'])
    .describe('"skipped" excludes the whole playlist from the import, "matched" restores it'),
});

@McpController()
export class ImportPlaylistsTool {
  constructor(private readonly importPlaylistsService: ImportPlaylistsService) {}

  @Tool({
    name: 'list-import-playlists',
    description:
      'List the playlists staged by an import. Each one becomes a new playlist when the import is validated',
    parameters: listParameters,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async listImportPlaylists(
    @Payload() { importId, page, perPage }: z.infer<typeof listParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const items = await this.importPlaylistsService.listPaginated(request.user, importId, {
      page,
      per_page: perPage,
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(items) }],
    };
  }

  @Tool({
    name: 'update-import-playlist',
    description: 'Skip a staged playlist, or restore it. Only while the import is awaiting review.',
    parameters: updateParameters,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
  })
  async updateImportPlaylist(
    @Payload() { importId, itemId, ...dto }: z.infer<typeof updateParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const item = await this.importPlaylistsService.patch(request.user, importId, itemId, dto);

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(item) }],
    };
  }
}
