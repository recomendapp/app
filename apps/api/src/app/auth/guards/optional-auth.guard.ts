import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { fromNodeHeaders } from 'better-auth/node';
import { IncomingHttpHeaders } from 'node:http';
import { OptionalAuthenticatedRequest, OptionalAuthenticatedSocket } from '../types/fastify';
import { AUTH_SERVICE, AuthService } from '../auth.service';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(
    @Inject(AUTH_SERVICE) private readonly auth: AuthService,
  ) {}
  
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isWs = context.getType() === 'ws';
    
    let requestOrClient: OptionalAuthenticatedRequest | OptionalAuthenticatedSocket;
    let rawHeaders: IncomingHttpHeaders;

    if (isWs) {
      requestOrClient = context.switchToWs().getClient<OptionalAuthenticatedSocket>();
      rawHeaders = requestOrClient.handshake.headers;
    } else {
      requestOrClient = context.switchToHttp().getRequest<OptionalAuthenticatedRequest>();
      rawHeaders = requestOrClient.headers;
    }

    const headers = fromNodeHeaders(rawHeaders);

    const session = await this.auth.api.getSession({
      headers,
    });

    requestOrClient.session = session?.session || null;
    requestOrClient.user = session?.user || null;

    return true;
  }
}