import { Module } from '@nestjs/common';
import { McpStrategy } from '@rekog/mcp-nest';
import { MCP_SERVER_NAME } from './mcp.constants';
import { mcpTransport } from './mcp-transport';
import { McpHttpController } from './mcp-http.controller';

// Tools/resources/prompts are discovered automatically from any
// @McpController() class registered anywhere in the app (see MoviesTool,
// MeTool) — no per-feature-module registration needed. Constructed at
// module-load time (not via a DI factory) so McpHttpController can bind to
// this exact instance at class-definition time — see mcp-http.controller.ts.
export const mcpStrategy = new McpStrategy({
  name: MCP_SERVER_NAME,
  version: '0.0.1',
  transports: [mcpTransport],
  // No @PublicTool() exists in this server: every tool requires a
  // logged-in user, enforced up front by McpHttpController's guard.
  allowUnauthenticatedAccess: false,
});

@Module({
  controllers: [McpHttpController],
  providers: [{ provide: McpStrategy, useValue: mcpStrategy }],
  exports: [McpStrategy],
})
export class McpModule {}
