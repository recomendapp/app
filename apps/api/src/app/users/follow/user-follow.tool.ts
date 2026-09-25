import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { UserFollowService } from './user-follow.service';
import { McpAuthenticatedRequest } from '../../auth/types/fastify';

const userIdParameter = z.object({
  userId: z.uuid().describe('The id of the other user'),
});

const requesterIdParameter = z.object({
  userId: z.uuid().describe('The id of the user who sent the request'),
});

@McpController()
export class UserFollowTool {
  constructor(private readonly userFollowService: UserFollowService) {}

  @Tool({
    name: 'get-user-follow',
    description:
      'Check whether the current user follows a user, and whether the follow is pending or ' +
      'accepted. Returns null when not followed.',
    parameters: userIdParameter,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async getUserFollow(
    @Payload() { userId }: { userId: string },
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const follow = await this.userFollowService.get({
      currentUserId: request.user.id,
      targetUserId: userId,
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(follow) }],
    };
  }

  @Tool({
    name: 'follow-user',
    description:
      'Follow a user. For a private profile this sends a follow request that stays pending ' +
      'until the user accepts it.',
    parameters: userIdParameter,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
  })
  async followUser(
    @Payload() { userId }: { userId: string },
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const follow = await this.userFollowService.set({
      currentUserId: request.user.id,
      targetUserId: userId,
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(follow) }],
    };
  }

  @Tool({
    name: 'unfollow-user',
    description: 'Unfollow a user, or cancel a pending follow request',
    parameters: userIdParameter,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
    },
  })
  async unfollowUser(
    @Payload() { userId }: { userId: string },
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const follow = await this.userFollowService.delete({
      currentUserId: request.user.id,
      targetUserId: userId,
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(follow) }],
    };
  }

  @Tool({
    name: 'accept-follow-request',
    description: 'Accept a pending follow request that a user sent to the current user',
    parameters: requesterIdParameter,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
  })
  async acceptFollowRequest(
    @Payload() { userId }: { userId: string },
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const follow = await this.userFollowService.accept({
      currentUserId: request.user.id,
      targetUserId: userId,
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(follow) }],
    };
  }

  @Tool({
    name: 'decline-follow-request',
    description: 'Decline a pending follow request that a user sent to the current user',
    parameters: requesterIdParameter,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
    },
  })
  async declineFollowRequest(
    @Payload() { userId }: { userId: string },
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const follow = await this.userFollowService.decline({
      currentUserId: request.user.id,
      targetUserId: userId,
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(follow) }],
    };
  }
}
