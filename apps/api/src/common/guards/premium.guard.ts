import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { DRIZZLE_SERVICE, DrizzleService } from '../../common/modules/drizzle/drizzle.module';
import { profile } from '@libs/db/schemas';
import { eq } from 'drizzle-orm';
import { AuthenticatedRequest } from '../../app/auth/types/fastify';

@Injectable()
export class PremiumGuard implements CanActivate {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.user || !request.user.id) {
      throw new ForbiddenException('Authentication required to access premium features.');
    }

    const userId = request.user.id;

    const userProfile = await this.db.query.profile.findFirst({
      where: eq(profile.id, userId),
      columns: { isPremium: true },
    });

    if (!userProfile?.isPremium) {
      throw new ForbiddenException('This feature is exclusive to Premium members.');
    }

    return true;
  }
}