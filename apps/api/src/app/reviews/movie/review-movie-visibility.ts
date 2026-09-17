import { NotFoundException } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { follow, logMovie, profile, reviewMovie } from '@libs/db/schemas';
import { DrizzleService } from '../../../common/modules/drizzle/drizzle.module';
import { User } from '../../auth/auth.service';

export async function assertReviewMovieVisible({
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
        OR ${logMovie.userId} = ${user.id}
        OR EXISTS (
          SELECT 1 FROM ${follow}
          WHERE ${follow.followerId} = ${user.id}
            AND ${follow.followingId} = ${logMovie.userId}
            AND ${follow.status} = 'accepted'
        )
      `
    : sql<boolean>`NOT ${profile.isPrivate}`;

  const [row] = await db
    .select({
      id: reviewMovie.id,
      canView: canViewCondition.as('can_view'),
    })
    .from(reviewMovie)
    .innerJoin(logMovie, eq(logMovie.id, reviewMovie.id))
    .innerJoin(profile, eq(profile.id, logMovie.userId))
    .where(eq(reviewMovie.id, reviewId))
    .limit(1);

  if (!row || !row.canView) {
    throw new NotFoundException('Review not found');
  }
}
