import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { getLocaleFromHeaders } from '@libs/i18n';
import { bookmarkStatusEnum, bookmarkTypeEnum } from '@libs/db/schemas';
import { BookmarkSortBy } from '../../bookmarks/dto/bookmarks.dto';
import { SortOrder } from '../../../common/dto/sort.dto';
import { z } from 'zod';
import { UserBookmarksService } from './user-bookmarks.service';
import { McpAuthenticatedRequest } from '../../auth/types/fastify';

const userBookmarksParameters = z.object({
  userId: z.uuid().optional().describe('The id of the user. Defaults to the current user'),
  status: z.enum(bookmarkStatusEnum.enumValues).default('active').describe('Bookmark status'),
  type: z.enum(bookmarkTypeEnum.enumValues).optional().describe('Only return movies or TV series'),
  sortBy: z.enum(BookmarkSortBy).default(BookmarkSortBy.CREATED_AT).describe('Sort field'),
  sortOrder: z.enum(SortOrder).default(SortOrder.DESC).describe('Sort order'),
  page: z.number().int().min(1).default(1).describe('Page number'),
  perPage: z.number().int().min(1).max(50).default(20).describe('Number of results per page'),
});

@McpController()
export class UserBookmarksTool {
  constructor(private readonly userBookmarksService: UserBookmarksService) {}

  @Tool({
    name: 'list-user-bookmarks',
    description:
      'List the watchlist (bookmarked movies and TV series) of a user. ' +
      '"completed" bookmarks are the ones the user watched since.',
    parameters: userBookmarksParameters,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async listUserBookmarks(
    @Payload()
    {
      userId,
      status,
      type,
      sortBy,
      sortOrder,
      page,
      perPage,
    }: z.infer<typeof userBookmarksParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const result = await this.userBookmarksService.listPaginated({
      targetUserId: userId ?? request.user.id,
      query: { status, type, sort_by: sortBy, sort_order: sortOrder, page, per_page: perPage },
      currentUser: request.user,
      locale: getLocaleFromHeaders(request.headers),
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result) }],
    };
  }
}
