import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { playlistMemberRoleEnum } from '@libs/db/schemas';
import { z } from 'zod';
import { PlaylistMembersService } from './playlist-members.service';
import { PlaylistMemberSortBy } from './playlist-members.dto';
import { McpAuthenticatedRequest } from '../../auth/types/fastify';
import { SortOrder } from '../../../common/dto/sort.dto';

const playlistIdParameter = z.number().int().describe('The id of the playlist');

const listMembersParameters = z.object({
  playlistId: playlistIdParameter,
  search: z.string().optional().describe('Filter the members by username'),
  sortOrder: z.enum(SortOrder).default(SortOrder.DESC).describe('Sort order by join date'),
  page: z.number().int().min(1).default(1).describe('Page number'),
  perPage: z.number().int().min(1).max(50).default(20).describe('Number of results per page'),
});

const membersParameters = z.object({
  playlistId: playlistIdParameter,
  userIds: z.array(z.uuid()).min(1).describe('The ids of the users'),
});

const updateMemberRoleParameters = z.object({
  playlistId: playlistIdParameter,
  userId: z.uuid().describe('The id of the member'),
  role: z
    .enum(playlistMemberRoleEnum.enumValues)
    .describe(
      'The new role. "viewer" can see the playlist, "editor" can also add, move and remove ' +
        'items, "admin" can also edit the playlist and manage members. ' +
        'Roles other than viewer need a Premium owner.',
    ),
});

@McpController()
export class PlaylistMembersTool {
  constructor(private readonly playlistMembersService: PlaylistMembersService) {}

  @Tool({
    name: 'list-playlist-members',
    description:
      'List the members of a playlist with their role. The current user must be a member.',
    parameters: listMembersParameters,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async listPlaylistMembers(
    @Payload()
    { playlistId, search, sortOrder, page, perPage }: z.infer<typeof listMembersParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const members = await this.playlistMembersService.listPaginated({
      currentUser: request.user,
      playlistId,
      query: {
        sort_by: PlaylistMemberSortBy.CREATED_AT,
        sort_order: sortOrder,
        search,
        page,
        per_page: perPage,
      },
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(members) }],
    };
  }

  @Tool({
    name: 'add-playlist-members',
    description:
      'Add users to a playlist as viewers. Requires the owner or admin role. ' +
      'Use "update-playlist-member-role" to give them more rights.',
    parameters: membersParameters,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
  })
  async addPlaylistMembers(
    @Payload() { playlistId, userIds }: z.infer<typeof membersParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const members = await this.playlistMembersService.add({
      currentUser: request.user,
      playlistId,
      dto: { userIds },
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(members) }],
    };
  }

  @Tool({
    name: 'update-playlist-member-role',
    description: 'Change the role of a member of a playlist. Requires the owner or admin role.',
    parameters: updateMemberRoleParameters,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
  })
  async updatePlaylistMemberRole(
    @Payload() { playlistId, userId, role }: z.infer<typeof updateMemberRoleParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const member = await this.playlistMembersService.update({
      currentUser: request.user,
      playlistId,
      targetUserId: userId,
      dto: { role },
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(member) }],
    };
  }

  @Tool({
    name: 'remove-playlist-members',
    description: 'Remove members from a playlist. Requires the owner or admin role.',
    parameters: membersParameters,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
    },
  })
  async removePlaylistMembers(
    @Payload() { playlistId, userIds }: z.infer<typeof membersParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const members = await this.playlistMembersService.delete({
      currentUser: request.user,
      playlistId,
      userIds,
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(members) }],
    };
  }
}
