import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, lt, or } from 'drizzle-orm';
import { z } from 'zod';
import { User } from '../../../auth/auth.service';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../../common/modules/drizzle/drizzle.module';
import {
  ReviewMovieLikeDto,
  ListPaginatedReviewMovieLikesDto,
  ListInfiniteReviewMovieLikesDto,
} from './dto/review-movie-like.dto';
import { profile, reviewMovie, reviewMovieLike, user } from '@libs/db/schemas';
import { USER_COMPACT_SELECT } from '@libs/db/selectors';
import { plainToInstance } from 'class-transformer';
import { PaginationQueryDto } from '../../../../common/dto/pagination.dto';
import { CursorPaginationQueryDto } from '../../../../common/dto/cursor-pagination.dto';
import { BaseCursor, decodeCursor, encodeCursor } from '../../../../utils/cursor';
import { assertReviewMovieVisible } from '../review-movie-visibility';
import { NotifyClient } from '@shared/notify';

const LikesCursorSchema = z.object({
  value: z.string().min(1),
  id: z.uuid(),
});

@Injectable()
export class ReviewMovieLikesService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
    private readonly notify: NotifyClient,
  ) {}

  async getLike({ user, reviewId }: { user: User; reviewId: number }): Promise<boolean> {
    const like = await this.db.query.reviewMovieLike.findFirst({
      where: and(eq(reviewMovieLike.userId, user.id), eq(reviewMovieLike.reviewId, reviewId)),
    });
    return !!like;
  }

  async like({ user, reviewId }: { user: User; reviewId: number }): Promise<ReviewMovieLikeDto> {
    await assertReviewMovieVisible({ db: this.db, reviewId, user });

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
        where: and(eq(reviewMovieLike.reviewId, reviewId), eq(reviewMovieLike.userId, user.id)),
      });
      return plainToInstance(ReviewMovieLikeDto, existingLike, { excludeExtraneousValues: true });
    }

    const review = await this.db.query.reviewMovie.findFirst({
      where: eq(reviewMovie.id, reviewId),
      with: { log: true },
    });
    if (review && review.log.userId !== user.id) {
      await this.notify.emit('review:liked', {
        actorId: user.id,
        targetUserId: review.log.userId,
        reviewAuthorId: review.log.userId,
        reviewId,
        mediaId: review.log.movieId,
        mediaType: 'movie',
      });
    }

    return plainToInstance(ReviewMovieLikeDto, like, { excludeExtraneousValues: true });
  }

  async unlike({ user, reviewId }: { user: User; reviewId: number }): Promise<ReviewMovieLikeDto> {
    const [deleted] = await this.db
      .delete(reviewMovieLike)
      .where(and(eq(reviewMovieLike.userId, user.id), eq(reviewMovieLike.reviewId, reviewId)))
      .returning();

    if (!deleted) {
      throw new NotFoundException('Like not found');
    }

    return plainToInstance(ReviewMovieLikeDto, deleted, { excludeExtraneousValues: true });
  }

  async listPaginated({
    reviewId,
    query,
    currentUser,
  }: {
    reviewId: number;
    query: PaginationQueryDto;
    currentUser: User | null;
  }): Promise<ListPaginatedReviewMovieLikesDto> {
    await assertReviewMovieVisible({ db: this.db, reviewId, user: currentUser });

    const { per_page, page } = query;
    const offset = (page - 1) * per_page;
    const whereClause = eq(reviewMovieLike.reviewId, reviewId);

    const [likes, totalCount] = await Promise.all([
      this.db
        .select({
          like: reviewMovieLike,
          user: USER_COMPACT_SELECT,
        })
        .from(reviewMovieLike)
        .innerJoin(user, eq(user.id, reviewMovieLike.userId))
        .innerJoin(profile, eq(profile.id, reviewMovieLike.userId))
        .where(whereClause)
        .orderBy(desc(reviewMovieLike.createdAt), desc(reviewMovieLike.userId))
        .limit(per_page)
        .offset(offset),
      this.db.$count(reviewMovieLike, whereClause),
    ]);

    return plainToInstance(ListPaginatedReviewMovieLikesDto, {
      data: likes.map((row) => row.user),
      meta: {
        total_results: totalCount,
        total_pages: Math.ceil(totalCount / per_page),
        current_page: page,
        per_page,
      },
    });
  }

  async listInfinite({
    reviewId,
    query,
    currentUser,
  }: {
    reviewId: number;
    query: CursorPaginationQueryDto;
    currentUser: User | null;
  }): Promise<ListInfiniteReviewMovieLikesDto> {
    await assertReviewMovieVisible({ db: this.db, reviewId, user: currentUser });

    const { per_page, cursor } = query;
    const cursorData = cursor ? decodeCursor(cursor, LikesCursorSchema) : null;

    const baseWhereClause = eq(reviewMovieLike.reviewId, reviewId);
    const cursorWhereClause = cursorData
      ? or(
          lt(reviewMovieLike.createdAt, cursorData.value),
          and(
            eq(reviewMovieLike.createdAt, cursorData.value),
            lt(reviewMovieLike.userId, cursorData.id),
          ),
        )
      : undefined;
    const finalWhereClause = cursorWhereClause
      ? and(baseWhereClause, cursorWhereClause)
      : baseWhereClause;

    const fetchLimit = per_page + 1;

    const results = await this.db
      .select({
        like: reviewMovieLike,
        user: USER_COMPACT_SELECT,
      })
      .from(reviewMovieLike)
      .innerJoin(user, eq(user.id, reviewMovieLike.userId))
      .innerJoin(profile, eq(profile.id, reviewMovieLike.userId))
      .where(finalWhereClause)
      .orderBy(desc(reviewMovieLike.createdAt), desc(reviewMovieLike.userId))
      .limit(fetchLimit);

    const hasNextPage = results.length > per_page;
    const paginatedResults = hasNextPage ? results.slice(0, per_page) : results;

    let nextCursor: string | null = null;

    if (hasNextPage) {
      const lastItem = paginatedResults[paginatedResults.length - 1];
      nextCursor = encodeCursor<BaseCursor<string, string>>({
        value: lastItem.like.createdAt,
        id: lastItem.like.userId,
      });
    }

    return plainToInstance(ListInfiniteReviewMovieLikesDto, {
      data: paginatedResults.map((row) => row.user),
      meta: {
        next_cursor: nextCursor,
        per_page,
      },
    });
  }
}
