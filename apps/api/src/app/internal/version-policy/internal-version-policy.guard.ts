import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import { ENV_SERVICE, type EnvService } from '@libs/env';

// Guards the /internal/version-policy/* routes called by mobile CI (see
// .github/workflows/mobile-router.yml), not by end users — same shared-secret
// pattern as InternalImportsGuard.
@Injectable()
export class InternalVersionPolicyGuard implements CanActivate {
  constructor(@Inject(ENV_SERVICE) private readonly env: EnvService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    const secret = this.env.API_INTERNAL_VERSION_POLICY_SECRET;

    if (!authHeader || authHeader !== `Bearer ${secret}`) {
      throw new UnauthorizedException('Invalid version policy internal secret');
    }

    return true;
  }
}
