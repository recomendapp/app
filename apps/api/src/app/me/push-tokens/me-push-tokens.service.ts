import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle/drizzle.module';
import { Session } from '../../auth/auth.service';
import { PushTokenDto, PushTokenSetDto } from './me-push-tokens.dto';
import { pushToken } from '@libs/db/schemas';
import { parseResponseDto } from '../../../utils/parse-response-dto';

@Injectable()
export class MePushTokensService {
  constructor(@Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService) {}

  async set({ session, dto }: { session: Session; dto: PushTokenSetDto }): Promise<PushTokenDto> {
    const [upsertedToken] = await this.db
      .insert(pushToken)
      .values({
        userId: session.userId,
        sessionId: session.id,
        provider: dto.provider,
        token: dto.token,
        deviceType: dto.deviceType,
      })
      .onConflictDoUpdate({
        target: [pushToken.userId, pushToken.token, pushToken.provider],
        set: {
          sessionId: session.id,
          deviceType: dto.deviceType,
        },
      })
      .returning();

    if (!upsertedToken) {
      throw new Error('Failed to upsert push token');
    }

    return parseResponseDto(PushTokenDto, upsertedToken, {
      excludeExtraneousValues: true,
    });
  }
}
