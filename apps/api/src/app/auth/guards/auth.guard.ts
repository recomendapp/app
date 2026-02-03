import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { fromNodeHeaders } from 'better-auth/node';
import { AuthenticatedRequest } from '../types/fastify';
import { AUTH_SERVICE, AuthService } from '../auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(AUTH_SERVICE) private readonly auth: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const headers = fromNodeHeaders(request.headers);

    const session = await this.auth.api.getSession({
      headers,
    });

    if (!session) {
      throw new UnauthorizedException();
    }

    request.session = session.session;
    request.user = session.user;

    return true;
  }
}
