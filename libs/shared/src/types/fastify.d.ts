import { SessionUser } from '../protos/__generated__/auth';

declare module 'fastify' {
  interface FastifyRequest {
    user?: SessionUser;
  }
}
