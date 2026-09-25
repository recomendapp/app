import { StreamableHttpTransport } from '@rekog/mcp-nest';

// Constructed once, at module-load time: McpHttpControllerFor(transport) in
// mcp-http.controller.ts needs this instance at class-definition time (a
// decorator can't wait for DI to resolve it), and mcp.module.ts's
// McpStrategy must share the exact same instance. Kept in its own file so
// mcp.module.ts and mcp-http.controller.ts can both import it without
// importing each other.
export const mcpTransport = new StreamableHttpTransport({ endpoint: '/mcp' });
