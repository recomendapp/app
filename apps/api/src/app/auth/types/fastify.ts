import { FastifyRequest } from 'fastify';
import { Session, User } from '../auth.service';
import { Socket } from 'socket.io';

export interface AuthenticatedRequest extends FastifyRequest {
  session: Session;
  user: User;
}

export interface OptionalAuthenticatedRequest extends FastifyRequest {
  session: Session | null;
  user: User | null;
}

// For McpBearerAuthGuard: a Bearer-token MCP call authenticates a user with
// no cookie session, so unlike AuthenticatedRequest there is no `session`
// field to be honest about.
export interface McpAuthenticatedRequest extends FastifyRequest {
  user: User;
}

export interface AuthenticatedSocket extends Socket {
  session: Session;
  user: User;
}

export interface OptionalAuthenticatedSocket extends Socket {
  session: Session | null;
  user: User | null;
}
