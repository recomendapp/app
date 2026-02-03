import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { AuthServiceClient, AUTH_SERVICE_NAME } from '@api/protos';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

@Injectable()
export class OptionalAuthGuard implements CanActivate, OnModuleInit {
  private authService!: AuthServiceClient;

  constructor(@Inject(AUTH_SERVICE_NAME) private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.authService =
      this.client.getService<AuthServiceClient>(AUTH_SERVICE_NAME);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers['authorization'];

    if (authorization && authorization.startsWith('Bearer ')) {
      const token = authorization.split(' ')[1];
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
    return true;
  }
}
