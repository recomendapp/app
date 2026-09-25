import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { playlistVisibilityEnum } from '@libs/db/schemas';
import { PLAYLIST_RULES } from '@libs/rules';
import { z } from 'zod';
import { PlaylistsService } from './playlists.service';
import { McpAuthenticatedRequest } from '../auth/types/fastify';

const playlistIdParameter = z.number().int().describe('The id of the playlist');

const titleParameter = z
  .string()
  .min(PLAYLIST_RULES.TITLE.MIN)
  .max(PLAYLIST_RULES.TITLE.MAX)
  .describe('The title of the playlist');
const descriptionParameter = z
  .string()
  .min(PLAYLIST_RULES.DESCRIPTION.MIN)
  .max(PLAYLIST_RULES.DESCRIPTION.MAX)
  .regex(PLAYLIST_RULES.DESCRIPTION.REGEX, 'The description cannot contain blank lines')
  .nullable()
  .describe('The description of the playlist');
const visibilityParameter = z
  .enum(playlistVisibilityEnum.enumValues)
  .describe(
    'Who can see the playlist: "public" (everyone), "followers" (accepted followers) or "private" (members only)',
  );

const createPlaylistParameters = z.object({
  title: titleParameter,
  description: descriptionParameter.default(null),
  visibility: visibilityParameter.default('private'),
});

const updatePlaylistParameters = z.object({
  playlistId: playlistIdParameter,
  title: titleParameter.optional(),
  description: descriptionParameter.optional(),
  visibility: visibilityParameter.optional().describe('Only the owner can change the visibility'),
});

@McpController()
export class PlaylistsTool {
  constructor(private readonly playlistsService: PlaylistsService) {}

  @Tool({
    name: 'get-playlist',
    description:
      'Get the details of a playlist, with its owner and the role of the current user in it',
    parameters: z.object({ playlistId: playlistIdParameter }),
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async getPlaylist(
    @Payload() { playlistId }: { playlistId: number },
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const playlist = await this.playlistsService.get({ playlistId, user: request.user });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(playlist) }],
    };
  }

  @Tool({
    name: 'create-playlist',
    description:
      'Create a new playlist owned by the current user. ' +
      'Add movies or TV series to it with "add-to-playlists".',
    parameters: createPlaylistParameters,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
    },
  })
  async createPlaylist(
    @Payload() dto: z.infer<typeof createPlaylistParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const playlist = await this.playlistsService.create(request.user, dto);

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(playlist) }],
    };
  }

  @Tool({
    name: 'update-playlist',
    description:
      'Update the title, description or visibility of a playlist. ' +
      'Requires the owner or admin role.',
    parameters: updatePlaylistParameters,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
  })
  async updatePlaylist(
    @Payload() { playlistId, ...updatePlaylistDto }: z.infer<typeof updatePlaylistParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const playlist = await this.playlistsService.update({
      user: request.user,
      playlistId,
      updatePlaylistDto,
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(playlist) }],
    };
  }

  @Tool({
    name: 'duplicate-playlist',
    description:
      'Copy a playlist visible to the current user, with all its items, into a new private ' +
      'playlist owned by the current user. Premium only.',
    parameters: z.object({ playlistId: playlistIdParameter }),
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
    },
  })
  async duplicatePlaylist(
    @Payload() { playlistId }: { playlistId: number },
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const playlist = await this.playlistsService.duplicate({ user: request.user, playlistId });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(playlist) }],
    };
  }

  @Tool({
    name: 'delete-playlist',
    description: 'Delete a playlist and all its items. Only the owner can delete it.',
    parameters: z.object({ playlistId: playlistIdParameter }),
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
    },
  })
  async deletePlaylist(
    @Payload() { playlistId }: { playlistId: number },
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const playlist = await this.playlistsService.delete({ user: request.user, playlistId });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(playlist) }],
    };
  }
}
