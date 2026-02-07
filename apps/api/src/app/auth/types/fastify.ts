import { FastifyRequest } from 'fastify';
import { Session, User } from '../auth.service';

export interface AuthenticatedRequest extends FastifyRequest {
	session: Session;
	user: User;
}

export interface OptionalAuthenticatedRequest extends FastifyRequest {
	session: Session | null;
	user: User | null;
}
