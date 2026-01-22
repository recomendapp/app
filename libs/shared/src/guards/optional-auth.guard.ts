import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  AuthServiceClient,
  AUTH_SERVICE_NAME,
} from '../protos/__generated__/auth';
import { FastifyRequest } from 'fastify';

@Injectable()
export class OptionalAuthGuard implements CanActivate, OnModuleInit {
  private authService: AuthServiceClient;

  constructor(@Inject(AUTH_SERVICE_NAME) private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.authService =
      this.client.getService<AuthServiceClient>(AUTH_SERVICE_NAME);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>(); // Type cast request
    const authorization = request.headers['authorization'];

    if (authorization && authorization.startsWith('Bearer ')) {
      const token = authorization.split(' ')[1];
      await this.validateAndAttachUser(token, request);
    }

    return true;
  }

  private async validateAndAttachUser(
    token: string,
    request: FastifyRequest,
  ): Promise<void> {
    try {
      const res = await firstValueFrom(
        this.authService.validateToken({ token }),
      );

      if (!res.error) {
        request.user = res.user;
      }
    } catch {
      // Do nothing, user remains unauthenticated
    }
  }
}
