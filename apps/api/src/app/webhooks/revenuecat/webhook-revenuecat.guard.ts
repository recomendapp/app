import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import { ENV_SERVICE, EnvService } from '@libs/env';

@Injectable()
export class RevenueCatGuard implements CanActivate {
  constructor(
    @Inject(ENV_SERVICE) private readonly env: EnvService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    const secret = this.env.REVENUECAT_WEBHOOK_SECRET;

    if (!authHeader || authHeader !== `Bearer ${secret}`) {
      throw new UnauthorizedException('Invalid RevenueCat webhook secret');
    }

    return true;
  }
}