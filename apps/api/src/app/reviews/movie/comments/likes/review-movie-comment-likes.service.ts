import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, lt, or } from 'drizzle-orm';
import { z } from 'zod';
import { User } from '../../../../auth/auth.service';
import {
  DRIZZLE_SERVICE,
  DrizzleService,
} from '../../../../../common/modules/drizzle/drizzle.module';
import {
  ReviewMovieCommentLikeDto,
  ListPaginatedReviewMovieCommentLikesDto,
  ListInfiniteReviewMovieCommentLikesDto,
} from './dto/review-movie-comment-like.dto';
import {
  profile,
  reviewMovie,
  reviewMovieComment,
  reviewMovieCommentLike,
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
export class ReviewMovieCommentLikesService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
    private readonly notify: NotifyClient,
  ) {}

  private async assertCommentLikable(reviewId: number, commentId: number) {
    const comment = await this.db.query.reviewMovieComment.findFirst({
      where: and(eq(reviewMovieComment.id, commentId), eq(reviewMovieComment.reviewId, reviewId)),
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

    const like = await this.db.query.reviewMovieCommentLike.findFirst({
      where: and(
        eq(reviewMovieCommentLike.userId, user.id),
        eq(reviewMovieCommentLike.commentId, commentId),
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
  }): Promise<ReviewMovieCommentLikeDto> {
    const comment = await this.assertCommentLikable(reviewId, commentId);

    const [like] = await this.db
      .insert(reviewMovieCommentLike)
      .values({
        commentId,
        userId: user.id,
      })
      .onConflictDoNothing()
      .returning();

    if (!like) {
      const existingLike = await this.db.query.reviewMovieCommentLike.findFirst({
        where: and(
          eq(reviewMovieCommentLike.commentId, commentId),
          eq(reviewMovieCommentLike.userId, user.id),
        ),
      });
      return plainToInstance(ReviewMovieCommentLikeDto, existingLike, {
        excludeExtraneousValues: true,
      });
    }

    if (comment.userId !== user.id) {
      const review = await this.db.query.reviewMovie.findFirst({
        where: eq(reviewMovie.id, reviewId),
        with: { log: true },
      });
      if (review) {
        await this.notify.emit('review-comment:liked', {
          actorId: user.id,
          targetUserId: comment.userId,
          reviewAuthorId: review.log.userId,
          reviewId,
          commentId,
          mediaId: review.log.movieId,
          mediaType: 'movie',
        });
      }
    }

    return plainToInstance(ReviewMovieCommentLikeDto, like, { excludeExtraneousValues: true });
  }

  async unlike({
    user,
    reviewId,
    commentId,
  }: {
    user: User;
    reviewId: number;
    commentId: number;
  }): Promise<ReviewMovieCommentLikeDto> {
    await this.assertCommentLikable(reviewId, commentId);

    const [deleted] = await this.db
      .delete(reviewMovieCommentLike)
      .where(
        and(
          eq(reviewMovieCommentLike.userId, user.id),
          eq(reviewMovieCommentLike.commentId, commentId),
        ),
      )
      .returning();

    if (!deleted) {
      throw new NotFoundException('Like not found');
    }

    return plainToInstance(ReviewMovieCommentLikeDto, deleted, { excludeExtraneousValues: true });
  }

  async listPaginated({
    reviewId,
    commentId,
    query,
  }: {
    reviewId: number;
    commentId: number;
    query: PaginationQueryDto;
  }): Promise<ListPaginatedReviewMovieCommentLikesDto> {
    await this.assertCommentLikable(reviewId, commentId);

    const { per_page, page } = query;
    const offset = (page - 1) * per_page;
    const whereClause = eq(reviewMovieCommentLike.commentId, commentId);

    const [likes, totalCount] = await Promise.all([
      this.db
        .select({
          like: reviewMovieCommentLike,
          user: USER_COMPACT_SELECT,
        })
        .from(reviewMovieCommentLike)
        .innerJoin(user, eq(user.id, reviewMovieCommentLike.userId))
        .innerJoin(profile, eq(profile.id, reviewMovieCommentLike.userId))
        .where(whereClause)
        .orderBy(desc(reviewMovieCommentLike.createdAt), desc(reviewMovieCommentLike.userId))
        .limit(per_page)
        .offset(offset),
      this.db.$count(reviewMovieCommentLike, whereClause),
    ]);

    return plainToInstance(ListPaginatedReviewMovieCommentLikesDto, {
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
  }): Promise<ListInfiniteReviewMovieCommentLikesDto> {
    await this.assertCommentLikable(reviewId, commentId);

    const { per_page, cursor } = query;
    const cursorData = cursor ? decodeCursor(cursor, LikesCursorSchema) : null;

    const baseWhereClause = eq(reviewMovieCommentLike.commentId, commentId);
    const cursorWhereClause = cursorData
      ? or(
          lt(reviewMovieCommentLike.createdAt, cursorData.value),
          and(
            eq(reviewMovieCommentLike.createdAt, cursorData.value),
            lt(reviewMovieCommentLike.userId, cursorData.id),
          ),
        )
      : undefined;
    const finalWhereClause = cursorWhereClause
      ? and(baseWhereClause, cursorWhereClause)
      : baseWhereClause;

    const fetchLimit = per_page + 1;

    const results = await this.db
      .select({
        like: reviewMovieCommentLike,
        user: USER_COMPACT_SELECT,
      })
      .from(reviewMovieCommentLike)
      .innerJoin(user, eq(user.id, reviewMovieCommentLike.userId))
      .innerJoin(profile, eq(profile.id, reviewMovieCommentLike.userId))
      .where(finalWhereClause)
      .orderBy(desc(reviewMovieCommentLike.createdAt), desc(reviewMovieCommentLike.userId))
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

    return plainToInstance(ListInfiniteReviewMovieCommentLikesDto, {
      data: paginatedResults.map((row) => row.user),
      meta: {
        next_cursor: nextCursor,
        per_page,
      },
    });
  }
}
