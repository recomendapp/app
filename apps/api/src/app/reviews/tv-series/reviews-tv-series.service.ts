import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { User } from '../../auth/auth.service';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle.module';
import { follow, logTvSeries, profile, reviewTvSeries, reviewTvSeriesLike } from '@libs/db/schemas';
import { plainToInstance } from 'class-transformer';
import { ReviewTvSeriesLikeDto } from './dto/review-tv-series-like.dto';

@Injectable()
export class ReviewsTvSeriesService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  async getLike({
    user,
    reviewId,
  }: {
    user: User,
    reviewId: number,
  }): Promise<boolean> {
    const like = await this.db.query.reviewTvSeriesLike.findFirst({
      where: and(
        eq(reviewTvSeriesLike.userId, user.id),
        eq(reviewTvSeriesLike.reviewId, reviewId),
      ),
    });
    return !!like;
  }

  async like({
    user,
    reviewId,
  }: {
    user: User,
    reviewId: number,
  }): Promise<ReviewTvSeriesLikeDto> {
    const [targetReview] = await this.db
      .select({
        id: reviewTvSeries.id,
        canView: sql<boolean>`
          ${logTvSeries.userId} = ${user.id} 
          OR NOT ${profile.isPrivate} 
          OR EXISTS (
            SELECT 1 FROM ${follow} 
            WHERE ${follow.followerId} = ${user.id} 
              AND ${follow.followingId} = ${logTvSeries.userId} 
              AND ${follow.status} = 'accepted'
          )
        `.as('can_view'),
      })
      .from(reviewTvSeries)
      .innerJoin(logTvSeries, eq(logTvSeries.id, reviewTvSeries.id))
      .innerJoin(profile, eq(profile.id, logTvSeries.userId))
      .where(eq(reviewTvSeries.id, reviewId))
      .limit(1);

    if (!targetReview || !targetReview.canView) {
      throw new NotFoundException('Review not found');
    }

    const [like] = await this.db
      .insert(reviewTvSeriesLike)
      .values({
        reviewId,
        userId: user.id,
      })
      .onConflictDoNothing()
      .returning();

    if (!like) {
      const existingLike = await this.db.query.reviewTvSeriesLike.findFirst({
        where: and(
          eq(reviewTvSeriesLike.reviewId, reviewId),
          eq(reviewTvSeriesLike.userId, user.id),
        ),
      });
      return plainToInstance(ReviewTvSeriesLikeDto, existingLike, { excludeExtraneousValues: true });
    }

    // TODO: update likes count in reviewTvSeries table (si tu as un compteur dénormalisé)

    return plainToInstance(ReviewTvSeriesLikeDto, like, { excludeExtraneousValues: true });
  }

  async unlike({
    user,
    reviewId,
  }: {
    user: User,
    reviewId: number,
  }): Promise<ReviewTvSeriesLikeDto> {
    const [deleted] = await this.db
      .delete(reviewTvSeriesLike)
      .where(and(
        eq(reviewTvSeriesLike.userId, user.id),
        eq(reviewTvSeriesLike.reviewId, reviewId),
      ))
      .returning();
    
    if (!deleted) {
      throw new NotFoundException('Like not found');
    }

    // TODO: update likes count

    return plainToInstance(ReviewTvSeriesLikeDto, deleted, { excludeExtraneousValues: true });
  }
}
