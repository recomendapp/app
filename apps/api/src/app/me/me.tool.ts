import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { MeService } from './me.service';
import { McpAuthenticatedRequest } from '../auth/types/fastify';

@McpController()
export class MeTool {
  constructor(private readonly meService: MeService) {}

  @Tool({
    name: 'whoami',
    description: 'Get the currently authenticated user for this MCP connection',
    parameters: z.object({}),
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  // No @UseGuards() here: McpHttpController's McpBearerAuthGuard already
  // authenticates every MCP request before it reaches any tool.
  async whoami(@McpRawRequest() request: McpAuthenticatedRequest) {
    const me = await this.meService.get(request.user);

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(me) }],
    };
  }
}
