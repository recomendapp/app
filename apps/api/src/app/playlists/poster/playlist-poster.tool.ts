import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { PlaylistPosterService } from './playlist-poster.service';
import { McpAuthenticatedRequest } from '../../auth/types/fastify';

// Uploading a poster needs a multipart file, which MCP tool calls cannot carry:
// only the removal is exposed.
@McpController()
export class PlaylistPosterTool {
  constructor(private readonly playlistPosterService: PlaylistPosterService) {}

  @Tool({
    name: 'delete-playlist-poster',
    description: 'Remove the custom poster of a playlist. Requires the owner or admin role.',
    parameters: z.object({ playlistId: z.number().int().describe('The id of the playlist') }),
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
    },
  })
  async deletePlaylistPoster(
    @Payload() { playlistId }: { playlistId: number },
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const playlist = await this.playlistPosterService.delete({ user: request.user, playlistId });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(playlist) }],
    };
  }
}
