import { Controller, UseGuards } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { McpHttpControllerFor } from '@rekog/mcp-nest';
import { McpBearerAuthGuard } from '../auth/guards';
import { mcpTransport } from './mcp-transport';

// Every MCP HTTP request (initialize, tools/list, each tools/call) goes
// through this guard before reaching any tool — there is no @PublicTool()
// in this server, the whole endpoint requires a logged-in user. Binding the
// controller to `mcpTransport` (McpHttpControllerFor) auto-disables the
// transport's own self-mount, so this controller is the sole owner of the
// /mcp route and the guard covers the whole surface in one place.
@ApiExcludeController()
@Controller('mcp')
@UseGuards(McpBearerAuthGuard)
export class McpHttpController extends McpHttpControllerFor(mcpTransport) {}
