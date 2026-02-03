import { FastifyRequest } from 'fastify';
import { SessionUser } from '@api/protos';

export interface AuthenticatedRequest extends FastifyRequest {
  user?: SessionUser;
}
