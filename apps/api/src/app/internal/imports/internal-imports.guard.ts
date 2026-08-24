import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import { ENV_SERVICE, EnvService } from '@libs/env';

// Guards the /internal/imports/* routes called by the Prefect flow (db-sync/import_transfer),
// not by end users — same shared-secret pattern as RevenueCatGuard.
@Injectable()
export class InternalImportsGuard implements CanActivate {
  constructor(@Inject(ENV_SERVICE) private readonly env: EnvService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    const secret = this.env.API_INTERNAL_IMPORTS_SECRET;

    if (!authHeader || authHeader !== `Bearer ${secret}`) {
      throw new UnauthorizedException('Invalid import internal secret');
    }

    return true;
  }
}
