import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { getLocaleFromHeaders } from '@libs/i18n';
import { z } from 'zod';
import { UserPinnedService } from './user-pinned.service';
import { McpAuthenticatedRequest } from '../../auth/types/fastify';

const userPinnedParameters = z.object({
  userId: z.uuid().optional().describe('The id of the user. Defaults to the current user'),
});

@McpController()
export class UserPinnedTool {
  constructor(private readonly userPinnedService: UserPinnedService) {}

  @Tool({
    name: 'list-user-pinned',
    description: 'List the items a user pinned on their profile',
    parameters: userPinnedParameters,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async listUserPinned(
    @Payload() { userId }: z.infer<typeof userPinnedParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const result = await this.userPinnedService.list({
      targetUserId: userId ?? request.user.id,
      currentUser: request.user,
      locale: getLocaleFromHeaders(request.headers),
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result) }],
    };
  }
}
