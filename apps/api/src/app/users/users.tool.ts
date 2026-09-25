import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { UsersService } from './users.service';
import { McpAuthenticatedRequest } from '../auth/types/fastify';

@McpController()
export class UsersTool {
  constructor(private readonly usersService: UsersService) {}

  @Tool({
    name: 'get-user',
    description:
      'Get the public profile of a user by username or id, with the follow state of the current user',
    parameters: z.object({
      identifier: z.string().min(1).describe('The username or the id of the user'),
    }),
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async getUser(
    @Payload() { identifier }: { identifier: string },
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const user = await this.usersService.get(identifier, request.user);

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(user) }],
    };
  }
}
