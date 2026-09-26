import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { BookmarksService } from './bookmarks.service';
import { BookmarkType } from './dto/bookmarks.dto';
import { BookmarkTarget } from './bookmarks.type';
import { McpAuthenticatedRequest } from '../auth/types/fastify';

const bookmarkMediaParameters = z.object({
  type: z.enum(BookmarkType).describe('The type of the media'),
  mediaId: z.number().int().describe('The TMDB id of the movie or TV series'),
});

const setBookmarkParameters = bookmarkMediaParameters.extend({
  comment: z
    .string()
    .max(180)
    .nullable()
    .optional()
    .describe('Optional note about why to watch it. Set to null to remove it, omit to keep it'),
});

function toBookmarkTarget({
  type,
  mediaId,
}: z.infer<typeof bookmarkMediaParameters>): BookmarkTarget {
  return type === BookmarkType.MOVIE ? { movieId: mediaId } : { tvSeriesId: mediaId };
}

@McpController()
export class BookmarksTool {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Tool({
    name: 'get-bookmark',
    description:
      'Get the active bookmark (watchlist entry) of the current user for a movie or TV series. ' +
      'Returns null when the media is not bookmarked.',
    parameters: bookmarkMediaParameters,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async getBookmark(
    @Payload() params: z.infer<typeof bookmarkMediaParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const bookmark = await this.bookmarksService.get({
      user: request.user,
      ...toBookmarkTarget(params),
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(bookmark) }],
    };
  }

  @Tool({
    name: 'set-bookmark',
    description:
      'Add a movie or TV series to the watchlist of the current user, or update its comment. ' +
      'The bookmark is completed automatically when the user logs the media.',
    parameters: setBookmarkParameters,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
  })
  async setBookmark(
    @Payload() { comment, ...params }: z.infer<typeof setBookmarkParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const bookmark = await this.bookmarksService.set({
      user: request.user,
      dto: { comment },
      ...toBookmarkTarget(params),
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(bookmark) }],
    };
  }

  @Tool({
    name: 'delete-bookmark',
    description: 'Remove a movie or TV series from the watchlist of the current user',
    parameters: bookmarkMediaParameters,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
    },
  })
  async deleteBookmark(
    @Payload() params: z.infer<typeof bookmarkMediaParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const bookmark = await this.bookmarksService.delete({
      user: request.user,
      ...toBookmarkTarget(params),
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(bookmark) }],
    };
  }
}
