import { ForbiddenException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { profile } from '@libs/db/schemas';
import { DbTransaction } from '@libs/db';
import { DrizzleService } from '../common/modules/drizzle/drizzle.module';

export const assertPremium = async (
  db: DrizzleService | DbTransaction,
  userId: string,
): Promise<void> => {
  const userProfile = await db.query.profile.findFirst({
    where: eq(profile.id, userId),
    columns: { isPremium: true },
  });

  if (!userProfile?.isPremium) {
    throw new ForbiddenException('This feature is exclusive to Premium members.');
  }
};
