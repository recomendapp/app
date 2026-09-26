import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { PLAYLIST_ITEM_RULES } from '@libs/rules';
import { z } from 'zod';
import { PlaylistsAddService } from './playlists-add.service';
import { PlaylistItemType } from '../items/playlist-items.dto';
import { McpAuthenticatedRequest } from '../../auth/types/fastify';

const addToPlaylistsParameters = z.object({
  type: z.enum(PlaylistItemType).describe('The type of the media'),
  mediaId: z.number().int().describe('The TMDB id of the movie or TV series'),
  playlistIds: z
    .array(z.number().int())
    .min(1)
    .describe('The ids of the playlists to add the media to (see "list-playlists-add-targets")'),
  comment: z
    .string()
    .max(PLAYLIST_ITEM_RULES.COMMENT.MAX)
    .nullable()
    .default(null)
    .describe('Optional note about the item'),
});

@McpController()
export class PlaylistsAddTool {
  constructor(private readonly playlistsAddService: PlaylistsAddService) {}

  @Tool({
    name: 'add-to-playlists',
    description:
      'Add a movie or TV series at the end of one or more playlists. ' +
      'Playlists where the current user is not the owner, admin or editor are skipped.',
    parameters: addToPlaylistsParameters,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
    },
  })
  async addToPlaylists(
    @Payload() { type, mediaId, ...dto }: z.infer<typeof addToPlaylistsParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const items = await this.playlistsAddService.add({ user: request.user, type, mediaId, dto });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(items) }],
    };
  }
}
