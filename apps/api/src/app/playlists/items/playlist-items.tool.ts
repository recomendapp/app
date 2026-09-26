import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { getLocaleFromHeaders } from '@libs/i18n';
import { PLAYLIST_ITEM_RULES } from '@libs/rules';
import { z } from 'zod';
import { PlaylistItemsService } from './playlist-items.service';
import { PlaylistItemSortBy, PlaylistItemType } from './playlist-items.dto';
import { McpAuthenticatedRequest } from '../../auth/types/fastify';
import { SortOrder } from '../../../common/dto/sort.dto';

const playlistIdParameter = z.number().int().describe('The id of the playlist');
const itemIdParameter = z.number().int().describe('The id of the playlist item');

const listPlaylistItemsParameters = z.object({
  playlistId: playlistIdParameter,
  type: z.enum(PlaylistItemType).optional().describe('Only return movies or TV series'),
  sortBy: z
    .enum(PlaylistItemSortBy)
    .default(PlaylistItemSortBy.RANK)
    .describe('Sort field. "rank" is the order of the playlist'),
  sortOrder: z.enum(SortOrder).default(SortOrder.ASC).describe('Sort order'),
  page: z.number().int().min(1).default(1).describe('Page number'),
  perPage: z.number().int().min(1).max(50).default(20).describe('Number of results per page'),
});

const updatePlaylistItemParameters = z.object({
  playlistId: playlistIdParameter,
  itemId: itemIdParameter,
  comment: z
    .string()
    .max(PLAYLIST_ITEM_RULES.COMMENT.MAX)
    .nullable()
    .optional()
    .describe('Note about the item. Set to null to remove it, omit to keep it'),
  position: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe('Move the item to this absolute position in the playlist (1 is the first)'),
});

const removePlaylistItemsParameters = z.object({
  playlistId: playlistIdParameter,
  itemIds: z.array(z.number().int()).min(1).describe('The ids of the playlist items to remove'),
});

@McpController()
export class PlaylistItemsTool {
  constructor(private readonly playlistItemsService: PlaylistItemsService) {}

  @Tool({
    name: 'list-playlist-items',
    description: 'List the movies and TV series of a playlist visible to the current user',
    parameters: listPlaylistItemsParameters,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async listPlaylistItems(
    @Payload()
    {
      playlistId,
      type,
      sortBy,
      sortOrder,
      page,
      perPage,
    }: z.infer<typeof listPlaylistItemsParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const items = await this.playlistItemsService.listPaginated({
      currentUser: request.user,
      playlistId,
      query: { type, sort_by: sortBy, sort_order: sortOrder, page, per_page: perPage },
      locale: getLocaleFromHeaders(request.headers),
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(items) }],
    };
  }

  @Tool({
    name: 'get-playlist-item',
    description: 'Get a single item of a playlist with its movie or TV series',
    parameters: z.object({ playlistId: playlistIdParameter, itemId: itemIdParameter }),
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async getPlaylistItem(
    @Payload() { playlistId, itemId }: { playlistId: number; itemId: number },
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const item = await this.playlistItemsService.get({
      currentUser: request.user,
      playlistId,
      itemId,
      locale: getLocaleFromHeaders(request.headers),
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(item) }],
    };
  }

  @Tool({
    name: 'update-playlist-item',
    description:
      'Change the comment of a playlist item, or move it to another position to reorder the ' +
      'playlist. Requires the owner, admin or editor role.',
    parameters: updatePlaylistItemParameters,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
  })
  async updatePlaylistItem(
    @Payload()
    { playlistId, itemId, comment, position }: z.infer<typeof updatePlaylistItemParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const item = await this.playlistItemsService.update({
      user: request.user,
      playlistId,
      itemId,
      dto: { comment, position },
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(item) }],
    };
  }

  @Tool({
    name: 'remove-playlist-items',
    description:
      'Remove items from a playlist by their item ids (not the TMDB ids). ' +
      'Requires the owner, admin or editor role.',
    parameters: removePlaylistItemsParameters,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
    },
  })
  async removePlaylistItems(
    @Payload() { playlistId, itemIds }: z.infer<typeof removePlaylistItemsParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const items = await this.playlistItemsService.delete({
      user: request.user,
      playlistId,
      dto: { itemIds },
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(items) }],
    };
  }
}
