import { Session, User } from 'better-auth/types';
import { FastifyRequest } from 'fastify';

export interface AuthenticatedRequest extends FastifyRequest {
	session: Session;
	user: User;
}

export interface OptionalAuthenticatedRequest extends FastifyRequest {
	session: Session | null;
	user: User | null;
}
