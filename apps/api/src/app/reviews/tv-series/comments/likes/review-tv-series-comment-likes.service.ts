import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, lt, or } from 'drizzle-orm';
import { z } from 'zod';
import { User } from '../../../../auth/auth.service';
import {
  DRIZZLE_SERVICE,
  DrizzleService,
} from '../../../../../common/modules/drizzle/drizzle.module';
import {
  ReviewTvSeriesCommentLikeDto,
  ListPaginatedReviewTvSeriesCommentLikesDto,
  ListInfiniteReviewTvSeriesCommentLikesDto,
} from './dto/review-tv-series-comment-like.dto';
import {
  profile,
  reviewTvSeries,
  reviewTvSeriesComment,
  reviewTvSeriesCommentLike,
  user,
} from '@libs/db/schemas';
import { USER_COMPACT_SELECT } from '@libs/db/selectors';
import { plainToInstance } from 'class-transformer';
import { PaginationQueryDto } from '../../../../../common/dto/pagination.dto';
import { CursorPaginationQueryDto } from '../../../../../common/dto/cursor-pagination.dto';
import { BaseCursor, decodeCursor, encodeCursor } from '../../../../../utils/cursor';
import { NotifyClient } from '@shared/notify';

const LikesCursorSchema = z.object({
  value: z.string().min(1),
  id: z.uuid(),
});

@Injectable()
export class ReviewTvSeriesCommentLikesService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
    private readonly notify: NotifyClient,
  ) {}

  private async assertCommentLikable(reviewId: number, commentId: number) {
    const comment = await this.db.query.reviewTvSeriesComment.findFirst({
      where: and(
        eq(reviewTvSeriesComment.id, commentId),
        eq(reviewTvSeriesComment.reviewId, reviewId),
      ),
    });
    if (!comment || comment.deletedAt) {
      throw new NotFoundException('Comment not found');
    }
    return comment;
  }

  async getLike({
    user,
    reviewId,
    commentId,
  }: {
    user: User;
    reviewId: number;
    commentId: number;
  }): Promise<boolean> {
    await this.assertCommentLikable(reviewId, commentId);

    const like = await this.db.query.reviewTvSeriesCommentLike.findFirst({
      where: and(
        eq(reviewTvSeriesCommentLike.userId, user.id),
        eq(reviewTvSeriesCommentLike.commentId, commentId),
      ),
    });
    return !!like;
  }

  async like({
    user,
    reviewId,
    commentId,
  }: {
    user: User;
    reviewId: number;
    commentId: number;
  }): Promise<ReviewTvSeriesCommentLikeDto> {
    const comment = await this.assertCommentLikable(reviewId, commentId);

    const [like] = await this.db
      .insert(reviewTvSeriesCommentLike)
      .values({
        commentId,
        userId: user.id,
      })
      .onConflictDoNothing()
      .returning();

    if (!like) {
      const existingLike = await this.db.query.reviewTvSeriesCommentLike.findFirst({
        where: and(
          eq(reviewTvSeriesCommentLike.commentId, commentId),
          eq(reviewTvSeriesCommentLike.userId, user.id),
        ),
      });
      return plainToInstance(ReviewTvSeriesCommentLikeDto, existingLike, {
        excludeExtraneousValues: true,
      });
    }

    if (comment.userId !== user.id) {
      const review = await this.db.query.reviewTvSeries.findFirst({
        where: eq(reviewTvSeries.id, reviewId),
        with: { log: true },
      });
      if (review) {
        await this.notify.emit('review-comment:liked', {
          actorId: user.id,
          targetUserId: comment.userId,
          reviewAuthorId: review.log.userId,
          reviewId,
          commentId,
          mediaId: review.log.tvSeriesId,
          mediaType: 'tv_series',
        });
      }
    }

    return plainToInstance(ReviewTvSeriesCommentLikeDto, like, { excludeExtraneousValues: true });
  }

  async unlike({
    user,
    reviewId,
    commentId,
  }: {
    user: User;
    reviewId: number;
    commentId: number;
  }): Promise<ReviewTvSeriesCommentLikeDto> {
    await this.assertCommentLikable(reviewId, commentId);

    const [deleted] = await this.db
      .delete(reviewTvSeriesCommentLike)
      .where(
        and(
          eq(reviewTvSeriesCommentLike.userId, user.id),
          eq(reviewTvSeriesCommentLike.commentId, commentId),
        ),
      )
      .returning();

    if (!deleted) {
      throw new NotFoundException('Like not found');
    }

    return plainToInstance(ReviewTvSeriesCommentLikeDto, deleted, {
      excludeExtraneousValues: true,
    });
  }

  async listPaginated({
    reviewId,
    commentId,
    query,
  }: {
    reviewId: number;
    commentId: number;
    query: PaginationQueryDto;
  }): Promise<ListPaginatedReviewTvSeriesCommentLikesDto> {
    await this.assertCommentLikable(reviewId, commentId);

    const { per_page, page } = query;
    const offset = (page - 1) * per_page;
    const whereClause = eq(reviewTvSeriesCommentLike.commentId, commentId);

    const [likes, totalCount] = await Promise.all([
      this.db
        .select({
          like: reviewTvSeriesCommentLike,
          user: USER_COMPACT_SELECT,
        })
        .from(reviewTvSeriesCommentLike)
        .innerJoin(user, eq(user.id, reviewTvSeriesCommentLike.userId))
        .innerJoin(profile, eq(profile.id, reviewTvSeriesCommentLike.userId))
        .where(whereClause)
        .orderBy(desc(reviewTvSeriesCommentLike.createdAt), desc(reviewTvSeriesCommentLike.userId))
        .limit(per_page)
        .offset(offset),
      this.db.$count(reviewTvSeriesCommentLike, whereClause),
    ]);

    return plainToInstance(ListPaginatedReviewTvSeriesCommentLikesDto, {
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
    commentId,
    query,
  }: {
    reviewId: number;
    commentId: number;
    query: CursorPaginationQueryDto;
  }): Promise<ListInfiniteReviewTvSeriesCommentLikesDto> {
    await this.assertCommentLikable(reviewId, commentId);

    const { per_page, cursor } = query;
    const cursorData = cursor ? decodeCursor(cursor, LikesCursorSchema) : null;

    const baseWhereClause = eq(reviewTvSeriesCommentLike.commentId, commentId);
    const cursorWhereClause = cursorData
      ? or(
          lt(reviewTvSeriesCommentLike.createdAt, cursorData.value),
          and(
            eq(reviewTvSeriesCommentLike.createdAt, cursorData.value),
            lt(reviewTvSeriesCommentLike.userId, cursorData.id),
          ),
        )
      : undefined;
    const finalWhereClause = cursorWhereClause
      ? and(baseWhereClause, cursorWhereClause)
      : baseWhereClause;

    const fetchLimit = per_page + 1;

    const results = await this.db
      .select({
        like: reviewTvSeriesCommentLike,
        user: USER_COMPACT_SELECT,
      })
      .from(reviewTvSeriesCommentLike)
      .innerJoin(user, eq(user.id, reviewTvSeriesCommentLike.userId))
      .innerJoin(profile, eq(profile.id, reviewTvSeriesCommentLike.userId))
      .where(finalWhereClause)
      .orderBy(desc(reviewTvSeriesCommentLike.createdAt), desc(reviewTvSeriesCommentLike.userId))
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

    return plainToInstance(ListInfiniteReviewTvSeriesCommentLikesDto, {
      data: paginatedResults.map((row) => row.user),
      meta: {
        next_cursor: nextCursor,
        per_page,
      },
    });
  }
}
