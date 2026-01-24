import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import {
  AuthServiceClient,
  AUTH_SERVICE_NAME,
} from '../protos/__generated__/auth';
import { FastifyRequest } from 'fastify';

@Injectable()
export class AuthGuard implements CanActivate, OnModuleInit {
  private authService: AuthServiceClient;

  constructor(@Inject(AUTH_SERVICE_NAME) private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.authService =
      this.client.getService<AuthServiceClient>(AUTH_SERVICE_NAME);
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const authorization = request.headers['authorization'];

    if (!authorization) {
      throw new UnauthorizedException('Authorization header is missing');
    }

    if (!authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid authorization scheme');
    }

    const token = authorization.split(' ')[1];

    return this.validateToken(token, request);
  }

  private async validateToken(
    token: string,
    request: FastifyRequest,
  ): Promise<boolean> {
    try {
      const res = await firstValueFrom(
        this.authService.validateToken({ token }),
      );

      if (res.error) {
        throw new UnauthorizedException(res.error);
      }

      // Assign to request.user. NestJS will merge this into the original request object.
      // The `user` property in FastifyRequest needs to be defined in `fastify.d.ts` for type safety.
      // For now, we are assigning a generic object.
      request.user = res.user;

      return true;
    } catch (e) {
      if (e instanceof UnauthorizedException) {
        throw e;
      }
      throw new UnauthorizedException('Token validation failed');
    }
  }
}
