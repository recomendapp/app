import { AuthenticatedRequest } from '@api/auth-tools';

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedRequest['user'];
  }
}
