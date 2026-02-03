import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { fromNodeHeaders } from 'better-auth/node';
import { OptionalAuthenticatedRequest } from '../types/fastify';
import { AUTH_SERVICE, AuthService } from '../auth.service';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(
    @Inject(AUTH_SERVICE) private readonly auth: AuthService,
  ) {}
  
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<OptionalAuthenticatedRequest>();

    const headers = fromNodeHeaders(request.headers);

    const session = await this.auth.api.getSession({
      headers,
    });

    request.session = session?.session || null;
    request.user = session?.user || null;

    return true;
  }
}
