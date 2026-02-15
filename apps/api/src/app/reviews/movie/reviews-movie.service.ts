import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { User } from '../../auth/auth.service';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle.module';
import { ReviewMovieLikeDto } from './dto/review-movie-like.dto';
import { follow, logMovie, profile, reviewMovie, reviewMovieLike } from '@libs/db/schemas';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ReviewsMovieService {
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
    const like = await this.db.query.reviewMovieLike.findFirst({
      where: and(
        eq(reviewMovieLike.userId, user.id),
        eq(reviewMovieLike.reviewId, reviewId),
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
  }): Promise<ReviewMovieLikeDto> {
    const [targetReview] = await this.db
      .select({
        id: reviewMovie.id,
        canView: sql<boolean>`
          ${logMovie.userId} = ${user.id} 
          OR NOT ${profile.isPrivate} 
          OR EXISTS (
            SELECT 1 FROM ${follow} 
            WHERE ${follow.followerId} = ${user.id} 
              AND ${follow.followingId} = ${logMovie.userId} 
              AND ${follow.status} = 'accepted'
          )
        `.as('can_view'),
      })
      .from(reviewMovie)
      .innerJoin(logMovie, eq(logMovie.id, reviewMovie.id))
      .innerJoin(profile, eq(profile.id, logMovie.userId))
      .where(eq(reviewMovie.id, reviewId))
      .limit(1);

    if (!targetReview || !targetReview.canView) {
      throw new NotFoundException('Review not found');
    }

    const [like] = await this.db
      .insert(reviewMovieLike)
      .values({
        reviewId,
        userId: user.id,
      })
      .onConflictDoNothing()
      .returning();

    if (!like) {
      const existingLike = await this.db.query.reviewMovieLike.findFirst({
        where: and(
          eq(reviewMovieLike.reviewId, reviewId),
          eq(reviewMovieLike.userId, user.id),
        ),
      });
      return plainToInstance(ReviewMovieLikeDto, existingLike, { excludeExtraneousValues: true });
    }

    // TODO: update likes count in reviewMovie table (si tu as un compteur dénormalisé)

    return plainToInstance(ReviewMovieLikeDto, like, { excludeExtraneousValues: true });
  }

  async unlike({
    user,
    reviewId,
  }: {
    user: User,
    reviewId: number,
  }): Promise<ReviewMovieLikeDto> {
    const [deleted] = await this.db
      .delete(reviewMovieLike)
      .where(and(
        eq(reviewMovieLike.userId, user.id),
        eq(reviewMovieLike.reviewId, reviewId),
      ))
      .returning();
    
    if (!deleted) {
      throw new NotFoundException('Like not found');
    }

    // TODO: update likes count

    return plainToInstance(ReviewMovieLikeDto, deleted, { excludeExtraneousValues: true });
  }
}
