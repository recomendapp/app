import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { fromNodeHeaders } from 'better-auth/node';
import { IncomingHttpHeaders } from 'node:http';
import { AuthenticatedRequest, AuthenticatedSocket } from '../types/fastify';
import { AUTH_SERVICE, AuthService } from '../auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(AUTH_SERVICE) private readonly auth: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isWs = context.getType() === 'ws';
    
    let requestOrClient: AuthenticatedRequest | AuthenticatedSocket;
    let rawHeaders: IncomingHttpHeaders;

    if (isWs) {
      const wsContext = context.switchToWs();
      requestOrClient = wsContext.getClient<AuthenticatedSocket>();
      rawHeaders = requestOrClient.handshake.headers; 
    } else {
      requestOrClient = context.switchToHttp().getRequest<AuthenticatedRequest>();
      rawHeaders = requestOrClient.headers;
    }

    const headers = fromNodeHeaders(rawHeaders);

    const session = await this.auth.api.getSession({
      headers,
    });

    if (!session) {
      if (isWs) throw new WsException('Unauthorized');
      throw new UnauthorizedException();
    }

    requestOrClient.session = session.session;
    requestOrClient.user = session.user;

    return true;
  }
}