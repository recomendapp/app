import { NotFoundException } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { follow, logTvSeries, profile, reviewTvSeries } from '@libs/db/schemas';
import { DrizzleService } from '../../../common/modules/drizzle/drizzle.module';
import { User } from '../../auth/auth.service';

export async function assertReviewTvSeriesVisible({
  db,
  reviewId,
  user,
}: {
  db: DrizzleService;
  reviewId: number;
  user: User | null;
}): Promise<void> {
  const canViewCondition = user
    ? sql<boolean>`
        NOT ${profile.isPrivate}
        OR ${logTvSeries.userId} = ${user.id}
        OR EXISTS (
          SELECT 1 FROM ${follow}
          WHERE ${follow.followerId} = ${user.id}
            AND ${follow.followingId} = ${logTvSeries.userId}
            AND ${follow.status} = 'accepted'
        )
      `
    : sql<boolean>`NOT ${profile.isPrivate}`;

  const [row] = await db
    .select({
      id: reviewTvSeries.id,
      canView: canViewCondition.as('can_view'),
    })
    .from(reviewTvSeries)
    .innerJoin(logTvSeries, eq(logTvSeries.id, reviewTvSeries.id))
    .innerJoin(profile, eq(profile.id, logTvSeries.userId))
    .where(eq(reviewTvSeries.id, reviewId))
    .limit(1);

  if (!row || !row.canView) {
    throw new NotFoundException('Review not found');
  }
}
