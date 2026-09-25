import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { PlaylistLikesService } from './playlist-likes.service';
import { McpAuthenticatedRequest } from '../../auth/types/fastify';

const playlistIdParameter = z.object({
  playlistId: z.number().int().describe('The id of the playlist'),
});

@McpController()
export class PlaylistLikesTool {
  constructor(private readonly playlistLikesService: PlaylistLikesService) {}

  @Tool({
    name: 'get-playlist-like',
    description: 'Check whether the current user likes a playlist',
    parameters: playlistIdParameter,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async getPlaylistLike(
    @Payload() { playlistId }: { playlistId: number },
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const isLiked = await this.playlistLikesService.get({ user: request.user, playlistId });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ isLiked }) }],
    };
  }

  @Tool({
    name: 'like-playlist',
    description: 'Like a playlist visible to the current user',
    parameters: playlistIdParameter,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
  })
  async likePlaylist(
    @Payload() { playlistId }: { playlistId: number },
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const result = await this.playlistLikesService.set({ user: request.user, playlistId });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result) }],
    };
  }

  @Tool({
    name: 'unlike-playlist',
    description:
      'Remove the like of the current user from a playlist. Returns null when it was not liked.',
    parameters: playlistIdParameter,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
    },
  })
  async unlikePlaylist(
    @Payload() { playlistId }: { playlistId: number },
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const result = await this.playlistLikesService.delete({ user: request.user, playlistId });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result) }],
    };
  }
}
