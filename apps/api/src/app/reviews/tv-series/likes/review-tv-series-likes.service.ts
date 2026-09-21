import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, lt, or } from 'drizzle-orm';
import { z } from 'zod';
import { User } from '../../../auth/auth.service';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../../common/modules/drizzle/drizzle.module';
import {
  ReviewTvSeriesLikeDto,
  ListPaginatedReviewTvSeriesLikesDto,
  ListInfiniteReviewTvSeriesLikesDto,
} from './dto/review-tv-series-like.dto';
import { profile, reviewTvSeries, reviewTvSeriesLike, user } from '@libs/db/schemas';
import { USER_COMPACT_SELECT } from '@libs/db/selectors';
import { parseResponseDto } from '../../../../utils/parse-response-dto';
import { PaginationQueryDto } from '../../../../common/dto/pagination.dto';
import { CursorPaginationQueryDto } from '../../../../common/dto/cursor-pagination.dto';
import { BaseCursor, decodeCursor, encodeCursor } from '../../../../utils/cursor';
import { assertReviewTvSeriesVisible } from '../review-tv-series-visibility';
import { NotifyClient } from '@shared/notify';

const LikesCursorSchema = z.object({
  value: z.string().min(1),
  id: z.uuid(),
});

@Injectable()
export class ReviewTvSeriesLikesService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
    private readonly notify: NotifyClient,
  ) {}

  async getLike({ user, reviewId }: { user: User; reviewId: number }): Promise<boolean> {
    const like = await this.db.query.reviewTvSeriesLike.findFirst({
      where: and(eq(reviewTvSeriesLike.userId, user.id), eq(reviewTvSeriesLike.reviewId, reviewId)),
    });
    return !!like;
  }

  async like({ user, reviewId }: { user: User; reviewId: number }): Promise<ReviewTvSeriesLikeDto> {
    await assertReviewTvSeriesVisible({ db: this.db, reviewId, user });

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
      return parseResponseDto(ReviewTvSeriesLikeDto, existingLike, {
        excludeExtraneousValues: true,
      });
    }

    const review = await this.db.query.reviewTvSeries.findFirst({
      where: eq(reviewTvSeries.id, reviewId),
      with: { log: true },
    });
    if (review && review.log.userId !== user.id) {
      await this.notify.emit('review:liked', {
        actorId: user.id,
        targetUserId: review.log.userId,
        reviewAuthorId: review.log.userId,
        reviewId,
        mediaId: review.log.tvSeriesId,
        mediaType: 'tv_series',
      });
    }

    return parseResponseDto(ReviewTvSeriesLikeDto, like, { excludeExtraneousValues: true });
  }

  async unlike({
    user,
    reviewId,
  }: {
    user: User;
    reviewId: number;
  }): Promise<ReviewTvSeriesLikeDto> {
    const [deleted] = await this.db
      .delete(reviewTvSeriesLike)
      .where(and(eq(reviewTvSeriesLike.userId, user.id), eq(reviewTvSeriesLike.reviewId, reviewId)))
      .returning();

    if (!deleted) {
      throw new NotFoundException('Like not found');
    }

    return parseResponseDto(ReviewTvSeriesLikeDto, deleted, { excludeExtraneousValues: true });
  }

  async listPaginated({
    reviewId,
    query,
    currentUser,
  }: {
    reviewId: number;
    query: PaginationQueryDto;
    currentUser: User | null;
  }): Promise<ListPaginatedReviewTvSeriesLikesDto> {
    await assertReviewTvSeriesVisible({ db: this.db, reviewId, user: currentUser });

    const { per_page, page } = query;
    const offset = (page - 1) * per_page;
    const whereClause = eq(reviewTvSeriesLike.reviewId, reviewId);

    const [likes, totalCount] = await Promise.all([
      this.db
        .select({
          like: reviewTvSeriesLike,
          user: USER_COMPACT_SELECT,
        })
        .from(reviewTvSeriesLike)
        .innerJoin(user, eq(user.id, reviewTvSeriesLike.userId))
        .innerJoin(profile, eq(profile.id, reviewTvSeriesLike.userId))
        .where(whereClause)
        .orderBy(desc(reviewTvSeriesLike.createdAt), desc(reviewTvSeriesLike.userId))
        .limit(per_page)
        .offset(offset),
      this.db.$count(reviewTvSeriesLike, whereClause),
    ]);

    return parseResponseDto(ListPaginatedReviewTvSeriesLikesDto, {
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
  }): Promise<ListInfiniteReviewTvSeriesLikesDto> {
    await assertReviewTvSeriesVisible({ db: this.db, reviewId, user: currentUser });

    const { per_page, cursor } = query;
    const cursorData = cursor ? decodeCursor(cursor, LikesCursorSchema) : null;

    const baseWhereClause = eq(reviewTvSeriesLike.reviewId, reviewId);
    const cursorWhereClause = cursorData
      ? or(
          lt(reviewTvSeriesLike.createdAt, cursorData.value),
          and(
            eq(reviewTvSeriesLike.createdAt, cursorData.value),
            lt(reviewTvSeriesLike.userId, cursorData.id),
          ),
        )
      : undefined;
    const finalWhereClause = cursorWhereClause
      ? and(baseWhereClause, cursorWhereClause)
      : baseWhereClause;

    const fetchLimit = per_page + 1;

    const results = await this.db
      .select({
        like: reviewTvSeriesLike,
        user: USER_COMPACT_SELECT,
      })
      .from(reviewTvSeriesLike)
      .innerJoin(user, eq(user.id, reviewTvSeriesLike.userId))
      .innerJoin(profile, eq(profile.id, reviewTvSeriesLike.userId))
      .where(finalWhereClause)
      .orderBy(desc(reviewTvSeriesLike.createdAt), desc(reviewTvSeriesLike.userId))
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

    return parseResponseDto(ListInfiniteReviewTvSeriesLikesDto, {
      data: paginatedResults.map((row) => row.user),
      meta: {
        next_cursor: nextCursor,
        per_page,
      },
    });
  }
}
