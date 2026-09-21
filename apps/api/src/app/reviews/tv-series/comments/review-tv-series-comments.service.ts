import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, gt, isNull, lt, or, SQL, sql } from 'drizzle-orm';
import { z } from 'zod';
import { User } from '../../../auth/auth.service';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../../common/modules/drizzle/drizzle.module';
import { profile, reviewTvSeries, reviewTvSeriesComment, user } from '@libs/db/schemas';
import { USER_COMPACT_SELECT } from '@libs/db/selectors';
import { parseResponseDto } from '../../../../utils/parse-response-dto';
import { SortOrder } from '../../../../common/dto/sort.dto';
import { BaseCursor, decodeCursor, encodeCursor } from '../../../../utils/cursor';
import { assertReviewTvSeriesVisible } from '../review-tv-series-visibility';
import { NotifyClient } from '@shared/notify';
import {
  ListInfiniteReviewTvSeriesCommentsDto,
  ListInfiniteReviewTvSeriesCommentsQueryDto,
  ListPaginatedReviewTvSeriesCommentsDto,
  ListPaginatedReviewTvSeriesCommentsQueryDto,
  ReviewTvSeriesCommentInputDto,
  ReviewTvSeriesCommentSortBy,
  ReviewTvSeriesCommentUpdateInputDto,
  ReviewTvSeriesCommentWithAuthorDto,
} from './dto/review-tv-series-comments.dto';

const CommentsCursorSchema = z.object({
  value: z.union([z.string().min(1), z.number()]),
  id: z.number(),
});

@Injectable()
export class ReviewTvSeriesCommentsService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
    private readonly notify: NotifyClient,
  ) {}

  private async getAuthor(userId: string) {
    const [row] = await this.db
      .select(USER_COMPACT_SELECT)
      .from(user)
      .innerJoin(profile, eq(profile.id, user.id))
      .where(eq(user.id, userId))
      .limit(1);
    return row;
  }

  private async getReviewOwnerAndMedia(reviewId: number) {
    const review = await this.db.query.reviewTvSeries.findFirst({
      where: eq(reviewTvSeries.id, reviewId),
      with: { log: true },
    });
    if (!review) return null;
    return { reviewAuthorId: review.log.userId, mediaId: review.log.tvSeriesId };
  }

  private async getCommentOrThrow(commentId: number, reviewId: number) {
    const comment = await this.db.query.reviewTvSeriesComment.findFirst({
      where: and(
        eq(reviewTvSeriesComment.id, commentId),
        eq(reviewTvSeriesComment.reviewId, reviewId),
      ),
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    return comment;
  }

  private getTopLevelWhereClause(reviewId: number): SQL {
    return and(
      eq(reviewTvSeriesComment.reviewId, reviewId),
      isNull(reviewTvSeriesComment.parentId),
      or(isNull(reviewTvSeriesComment.deletedAt), gt(reviewTvSeriesComment.repliesCount, 0)),
    ) as SQL;
  }

  private getOrderBy(sortBy: ReviewTvSeriesCommentSortBy, sortOrder: SortOrder) {
    const direction = sortOrder === SortOrder.ASC ? asc : desc;
    switch (sortBy) {
      case ReviewTvSeriesCommentSortBy.LIKES_COUNT:
        return [direction(reviewTvSeriesComment.likesCount), direction(reviewTvSeriesComment.id)];
      case ReviewTvSeriesCommentSortBy.CREATED_AT:
      default:
        return [direction(reviewTvSeriesComment.createdAt), direction(reviewTvSeriesComment.id)];
    }
  }

  private buildCursorClause(
    sortBy: ReviewTvSeriesCommentSortBy,
    sortOrder: SortOrder,
    cursorData: z.infer<typeof CommentsCursorSchema> | null,
  ): SQL | undefined {
    if (!cursorData) return undefined;
    const operator = sortOrder === SortOrder.ASC ? gt : lt;

    if (sortBy === ReviewTvSeriesCommentSortBy.LIKES_COUNT) {
      return or(
        operator(reviewTvSeriesComment.likesCount, Number(cursorData.value)),
        and(
          eq(reviewTvSeriesComment.likesCount, Number(cursorData.value)),
          operator(reviewTvSeriesComment.id, cursorData.id),
        ),
      );
    }

    const createdDate = String(cursorData.value);
    return or(
      operator(reviewTvSeriesComment.createdAt, createdDate),
      and(
        eq(reviewTvSeriesComment.createdAt, createdDate),
        operator(reviewTvSeriesComment.id, cursorData.id),
      ),
    );
  }

  private async fetchPaginated(whereClause: SQL, orderBy: SQL[], page: number, per_page: number) {
    const offset = (page - 1) * per_page;

    const [rows, totalCount] = await Promise.all([
      this.db
        .select({ comment: reviewTvSeriesComment, author: USER_COMPACT_SELECT })
        .from(reviewTvSeriesComment)
        .innerJoin(user, eq(user.id, reviewTvSeriesComment.userId))
        .innerJoin(profile, eq(profile.id, reviewTvSeriesComment.userId))
        .where(whereClause)
        .orderBy(...orderBy)
        .limit(per_page)
        .offset(offset),
      this.db.$count(reviewTvSeriesComment, whereClause),
    ]);

    return {
      data: rows.map((row) => ({ ...row.comment, author: row.author })),
      meta: {
        total_results: totalCount,
        total_pages: Math.ceil(totalCount / per_page),
        current_page: page,
        per_page,
      },
    };
  }

  private async fetchInfinite(
    baseWhereClause: SQL,
    orderBy: SQL[],
    sortBy: ReviewTvSeriesCommentSortBy,
    sortOrder: SortOrder,
    cursor: string | undefined,
    per_page: number,
  ) {
    const cursorData = cursor ? decodeCursor(cursor, CommentsCursorSchema) : null;
    const cursorClause = this.buildCursorClause(sortBy, sortOrder, cursorData);
    const finalWhereClause = cursorClause
      ? (and(baseWhereClause, cursorClause) as SQL)
      : baseWhereClause;
    const fetchLimit = per_page + 1;

    const rows = await this.db
      .select({ comment: reviewTvSeriesComment, author: USER_COMPACT_SELECT })
      .from(reviewTvSeriesComment)
      .innerJoin(user, eq(user.id, reviewTvSeriesComment.userId))
      .innerJoin(profile, eq(profile.id, reviewTvSeriesComment.userId))
      .where(finalWhereClause)
      .orderBy(...orderBy)
      .limit(fetchLimit);

    const hasNextPage = rows.length > per_page;
    const paginatedResults = hasNextPage ? rows.slice(0, per_page) : rows;

    let nextCursor: string | null = null;
    if (hasNextPage) {
      const lastItem = paginatedResults[paginatedResults.length - 1];
      const cursorValue =
        sortBy === ReviewTvSeriesCommentSortBy.LIKES_COUNT
          ? lastItem.comment.likesCount
          : lastItem.comment.createdAt;
      nextCursor = encodeCursor<BaseCursor<string | number, number>>({
        value: cursorValue,
        id: lastItem.comment.id,
      });
    }

    return {
      data: paginatedResults.map((row) => ({ ...row.comment, author: row.author })),
      meta: { next_cursor: nextCursor, per_page },
    };
  }

  async create({
    user: currentUser,
    reviewId,
    dto,
  }: {
    user: User;
    reviewId: number;
    dto: ReviewTvSeriesCommentInputDto;
  }): Promise<ReviewTvSeriesCommentWithAuthorDto> {
    await assertReviewTvSeriesVisible({ db: this.db, reviewId, user: currentUser });

    let parentId: number | null = null;
    let parentAuthorId: string | null = null;
    if (dto.parentId != null) {
      const parent = await this.getCommentOrThrow(dto.parentId, reviewId);
      if (parent.parentId !== null) {
        throw new BadRequestException('Cannot reply to a reply');
      }
      parentId = parent.id;
      parentAuthorId = parent.userId;
    }

    const [comment] = await this.db
      .insert(reviewTvSeriesComment)
      .values({
        reviewId,
        userId: currentUser.id,
        parentId,
        body: dto.body.trim(),
      })
      .returning();

    const reviewOwnerAndMedia = await this.getReviewOwnerAndMedia(reviewId);
    if (reviewOwnerAndMedia) {
      const { reviewAuthorId, mediaId } = reviewOwnerAndMedia;
      if (parentId === null) {
        if (reviewAuthorId !== currentUser.id) {
          await this.notify.emit('review:commented', {
            actorId: currentUser.id,
            targetUserId: reviewAuthorId,
            reviewAuthorId,
            reviewId,
            commentId: comment.id,
            mediaId,
            mediaType: 'tv_series',
            comment: comment.body,
          });
        }
      } else if (parentAuthorId !== null && parentAuthorId !== currentUser.id) {
        await this.notify.emit('review-comment:replied', {
          actorId: currentUser.id,
          targetUserId: parentAuthorId,
          reviewAuthorId,
          reviewId,
          commentId: comment.id,
          parentCommentId: parentId,
          mediaId,
          mediaType: 'tv_series',
          comment: comment.body,
        });
      }
    }

    const author = await this.getAuthor(currentUser.id);

    return parseResponseDto(
      ReviewTvSeriesCommentWithAuthorDto,
      { ...comment, author },
      { excludeExtraneousValues: true },
    );
  }

  async update({
    user: currentUser,
    reviewId,
    commentId,
    dto,
  }: {
    user: User;
    reviewId: number;
    commentId: number;
    dto: ReviewTvSeriesCommentUpdateInputDto;
  }): Promise<ReviewTvSeriesCommentWithAuthorDto> {
    const comment = await this.getCommentOrThrow(commentId, reviewId);

    if (comment.userId !== currentUser.id) {
      throw new ForbiddenException('You can only edit your own comment');
    }
    if (comment.deletedAt) {
      throw new BadRequestException('Cannot edit a deleted comment');
    }

    const [updated] = await this.db
      .update(reviewTvSeriesComment)
      .set({ body: dto.body.trim() })
      .where(eq(reviewTvSeriesComment.id, commentId))
      .returning();

    const author = await this.getAuthor(currentUser.id);

    return parseResponseDto(
      ReviewTvSeriesCommentWithAuthorDto,
      { ...updated, author },
      { excludeExtraneousValues: true },
    );
  }

  async delete({
    user: currentUser,
    reviewId,
    commentId,
  }: {
    user: User;
    reviewId: number;
    commentId: number;
  }): Promise<ReviewTvSeriesCommentWithAuthorDto> {
    const comment = await this.getCommentOrThrow(commentId, reviewId);

    if (comment.deletedAt) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== currentUser.id) {
      const review = await this.db.query.reviewTvSeries.findFirst({
        where: eq(reviewTvSeries.id, reviewId),
        with: { log: true },
      });
      if (review?.log.userId !== currentUser.id) {
        throw new ForbiddenException(
          'You can only delete your own comment or comments on your review',
        );
      }
    }

    // A top-level comment sticks around soft-deleted (body masked) only while it
    // still has replies, so those replies keep a thread to hang off of. Replies
    // are leaves - deleting one never orphans anything - so they're always hard
    // deleted, same as an empty top-level comment.
    const shouldSoftDelete = comment.parentId === null && comment.repliesCount > 0;

    if (shouldSoftDelete) {
      const [deleted] = await this.db
        .update(reviewTvSeriesComment)
        .set({ deletedAt: sql`now()` })
        .where(eq(reviewTvSeriesComment.id, commentId))
        .returning();

      const author = await this.getAuthor(deleted.userId);

      return parseResponseDto(
        ReviewTvSeriesCommentWithAuthorDto,
        { ...deleted, author },
        { excludeExtraneousValues: true },
      );
    }

    const [deleted] = await this.db
      .delete(reviewTvSeriesComment)
      .where(eq(reviewTvSeriesComment.id, commentId))
      .returning();

    const author = await this.getAuthor(deleted.userId);

    return parseResponseDto(
      ReviewTvSeriesCommentWithAuthorDto,
      { ...deleted, author },
      { excludeExtraneousValues: true },
    );
  }

  /* ---------------------------------- List ---------------------------------- */
  async listPaginated({
    reviewId,
    query,
    currentUser,
  }: {
    reviewId: number;
    query: ListPaginatedReviewTvSeriesCommentsQueryDto;
    currentUser: User | null;
  }): Promise<ListPaginatedReviewTvSeriesCommentsDto> {
    await assertReviewTvSeriesVisible({ db: this.db, reviewId, user: currentUser });

    const { per_page, page, sort_by, sort_order } = query;
    const whereClause = this.getTopLevelWhereClause(reviewId);
    const orderBy = this.getOrderBy(sort_by, sort_order);
    const result = await this.fetchPaginated(whereClause, orderBy, page, per_page);

    return parseResponseDto(ListPaginatedReviewTvSeriesCommentsDto, result);
  }

  async listInfinite({
    reviewId,
    query,
    currentUser,
  }: {
    reviewId: number;
    query: ListInfiniteReviewTvSeriesCommentsQueryDto;
    currentUser: User | null;
  }): Promise<ListInfiniteReviewTvSeriesCommentsDto> {
    await assertReviewTvSeriesVisible({ db: this.db, reviewId, user: currentUser });

    const { per_page, sort_order, sort_by, cursor } = query;
    const whereClause = this.getTopLevelWhereClause(reviewId);
    const orderBy = this.getOrderBy(sort_by, sort_order);
    const result = await this.fetchInfinite(
      whereClause,
      orderBy,
      sort_by,
      sort_order,
      cursor,
      per_page,
    );

    return parseResponseDto(ListInfiniteReviewTvSeriesCommentsDto, result);
  }

  async listRepliesPaginated({
    reviewId,
    commentId,
    query,
    currentUser,
  }: {
    reviewId: number;
    commentId: number;
    query: ListPaginatedReviewTvSeriesCommentsQueryDto;
    currentUser: User | null;
  }): Promise<ListPaginatedReviewTvSeriesCommentsDto> {
    await assertReviewTvSeriesVisible({ db: this.db, reviewId, user: currentUser });
    await this.getCommentOrThrow(commentId, reviewId);

    const { per_page, page, sort_by, sort_order } = query;
    const whereClause = eq(reviewTvSeriesComment.parentId, commentId);
    const orderBy = this.getOrderBy(sort_by, sort_order);
    const result = await this.fetchPaginated(whereClause, orderBy, page, per_page);

    return parseResponseDto(ListPaginatedReviewTvSeriesCommentsDto, result);
  }

  async listRepliesInfinite({
    reviewId,
    commentId,
    query,
    currentUser,
  }: {
    reviewId: number;
    commentId: number;
    query: ListInfiniteReviewTvSeriesCommentsQueryDto;
    currentUser: User | null;
  }): Promise<ListInfiniteReviewTvSeriesCommentsDto> {
    await assertReviewTvSeriesVisible({ db: this.db, reviewId, user: currentUser });
    await this.getCommentOrThrow(commentId, reviewId);

    const { per_page, sort_order, sort_by, cursor } = query;
    const whereClause = eq(reviewTvSeriesComment.parentId, commentId);
    const orderBy = this.getOrderBy(sort_by, sort_order);
    const result = await this.fetchInfinite(
      whereClause,
      orderBy,
      sort_by,
      sort_order,
      cursor,
      per_page,
    );

    return parseResponseDto(ListInfiniteReviewTvSeriesCommentsDto, result);
  }
}
