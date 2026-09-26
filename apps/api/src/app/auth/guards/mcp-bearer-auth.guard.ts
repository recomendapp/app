import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { verifyAccessTokenRequest } from 'better-auth/oauth2';
import { eq } from 'drizzle-orm';
import type { FastifyReply } from 'fastify';
import { user } from '@libs/db/schemas';
import { ENV_SERVICE, EnvService } from '@libs/env';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle/drizzle.module';
import { McpAuthenticatedRequest } from '../types/fastify';
import { User } from '../auth.service';

// Whole-endpoint guard on McpHttpController: validates the RFC 6750 Bearer
// access token an MCP client sends on every request, after completing the
// /oauth2/authorize + /oauth2/token dance (@better-auth/mcp, wired in
// auth.service.ts). This is a *different* credential from
// AuthGuard/OptionalAuthGuard's session cookie: those read
// `auth.api.getSession()` off a Cookie header, which a remote MCP client
// never has. `sub` is assumed to be the raw user id (no `subjectType:
// "pairwise"` is configured on any oauth client) — verified against a real
// issued token, not just read from the oauth-provider source.
//
// Runs at the HTTP layer (not per-tool): every rejection sets
// `WWW-Authenticate` pointing at the RFC 9728 protected-resource metadata,
// so a client gets a real 401 to discover OAuth from, instead of a
// generic tool-call failure buried in a 200 JSON-RPC response.
@Injectable()
export class McpBearerAuthGuard implements CanActivate {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
    @Inject(ENV_SERVICE) private readonly env: EnvService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<McpAuthenticatedRequest>();

    const dpopHeader = request.headers['dpop'];

    let claims;
    try {
      claims = await verifyAccessTokenRequest(
        {
          authorizationHeader: request.headers.authorization ?? null,
          method: request.method,
          url: new URL(request.url, this.env.API_URL).toString(),
          dpopProofJwt: Array.isArray(dpopHeader) ? dpopHeader[0] : (dpopHeader ?? null),
        },
        {
          verifyOptions: {
            issuer: this.env.API_URL,
            audience: new URL('/mcp', this.env.API_URL).toString(),
          },
          jwksUrl: new URL('/auth/jwks', this.env.API_URL).toString(),
        },
      );
    } catch {
      this.challenge(context);
      throw new UnauthorizedException();
    }

    if (!claims.sub) {
      this.challenge(context);
      throw new UnauthorizedException();
    }

    const foundUser = await this.db.query.user.findFirst({
      where: eq(user.id, claims.sub),
      columns: { id: true },
    });
    if (!foundUser) {
      this.challenge(context);
      throw new UnauthorizedException();
    }

    // Only `id` is verified/attached: the Drizzle row's timestamp columns are
    // string-mode, better-auth's `User` type expects `Date`, and nothing
    // downstream of this guard needs more than the id.
    const authenticatedUser = { id: foundUser.id } as User;
    request.user = authenticatedUser;
    // mcp-nest reads the user off `request.raw` (the underlying Node
    // IncomingMessage), not the Fastify request this guard receives: it's
    // what @McpRawRequest() hands to tools, and what its own
    // ToolAuthorizationService checks — see StreamableHttpTransport.handlePost,
    // which forwards `req.raw` as the MCP "raw request".
    (request.raw as unknown as { user?: User }).user = authenticatedUser;
    return true;
  }

  private challenge(context: ExecutionContext) {
    const reply = context.switchToHttp().getResponse<FastifyReply>();
    const resourceMetadataUrl = new URL(
      '/.well-known/oauth-protected-resource/mcp',
      this.env.API_URL,
    ).toString();
    reply.header('WWW-Authenticate', `Bearer resource_metadata="${resourceMetadataUrl}"`);
  }
}
