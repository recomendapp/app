import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { PlaylistSavesService } from './playlist-saves.service';
import { McpAuthenticatedRequest } from '../../auth/types/fastify';

const playlistIdParameter = z.object({
  playlistId: z.number().int().describe('The id of the playlist'),
});

@McpController()
export class PlaylistSavesTool {
  constructor(private readonly playlistSavesService: PlaylistSavesService) {}

  @Tool({
    name: 'get-playlist-save',
    description: 'Check whether the current user saved a playlist to their library',
    parameters: playlistIdParameter,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async getPlaylistSave(
    @Payload() { playlistId }: { playlistId: number },
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const isSaved = await this.playlistSavesService.get({ user: request.user, playlistId });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ isSaved }) }],
    };
  }

  @Tool({
    name: 'save-playlist',
    description: 'Save a playlist of another user to the library of the current user',
    parameters: playlistIdParameter,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
  })
  async savePlaylist(
    @Payload() { playlistId }: { playlistId: number },
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const result = await this.playlistSavesService.set({ user: request.user, playlistId });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result) }],
    };
  }

  @Tool({
    name: 'unsave-playlist',
    description:
      'Remove a playlist from the saved playlists of the current user. Returns null when it was not saved.',
    parameters: playlistIdParameter,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
    },
  })
  async unsavePlaylist(
    @Payload() { playlistId }: { playlistId: number },
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const result = await this.playlistSavesService.delete({ user: request.user, playlistId });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result) }],
    };
  }
}
