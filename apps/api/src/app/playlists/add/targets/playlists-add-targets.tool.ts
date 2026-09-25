import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { PlaylistsAddTargetsService } from './playlists-add-targets.service';
import { PlaylistTargetFilter } from './playlists-add-targets.dto';
import { PlaylistItemType } from '../../items/playlist-items.dto';
import { PlaylistSortBy } from '../../dto/playlists.dto';
import { McpAuthenticatedRequest } from '../../../auth/types/fastify';
import { SortOrder } from '../../../../common/dto/sort.dto';

const listAddTargetsParameters = z.object({
  type: z.enum(PlaylistItemType).describe('The type of the media'),
  mediaId: z.number().int().describe('The TMDB id of the movie or TV series'),
  filter: z
    .enum(PlaylistTargetFilter)
    .default(PlaylistTargetFilter.ALL)
    .describe('"mine" for owned playlists, "saved" for saved playlists, "all" for both'),
  search: z.string().optional().describe('Filter the playlists by title'),
});

@McpController()
export class PlaylistsAddTargetsTool {
  constructor(private readonly playlistsAddTargetsService: PlaylistsAddTargetsService) {}

  @Tool({
    name: 'list-playlists-add-targets',
    description:
      'List the playlists the current user can add a movie or TV series to. ' +
      'Each playlist tells whether the media is already in it.',
    parameters: listAddTargetsParameters,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async listPlaylistsAddTargets(
    @Payload() { type, mediaId, filter, search }: z.infer<typeof listAddTargetsParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const playlists = await this.playlistsAddTargetsService.listAll({
      currentUser: request.user,
      type,
      mediaId,
      query: {
        sort_by: PlaylistSortBy.UPDATED_AT,
        sort_order: SortOrder.DESC,
        filter,
        search,
      },
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(playlists) }],
    };
  }
}
