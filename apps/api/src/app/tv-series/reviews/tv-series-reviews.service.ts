import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq, exists, gt, lt, or, sql, SQL } from 'drizzle-orm';
import { follow, logTvSeries, profile, reviewTvSeries, user } from '@libs/db/schemas';
import { User } from '../../auth/auth.service';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle/drizzle.module';
import DOMPurify from 'isomorphic-dompurify';
import { SortOrder } from '../../../common/dto/sort.dto';
import { DbTransaction } from '@libs/db';
import { BaseCursor, decodeCursor, encodeCursor } from '../../../utils/cursor';
import { plainToInstance } from 'class-transformer';
import { USER_COMPACT_SELECT } from '@libs/db/selectors';
import { ListInfiniteReviewsTvSeriesDto, ListInfiniteReviewsTvSeriesQueryDto, ListPaginatedReviewsTvSeriesDto, ListPaginatedReviewsTvSeriesQueryDto, ReviewTvSeriesDto, ReviewTvSeriesInputDto, ReviewTvSeriesSortBy } from '../../reviews/tv-series/dto/review-tv-series.dto';

@Injectable()
export class TvSeriesReviewsService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  async upsert({
    user,
    tvSeriesId,
    dto,
  }: {
    user: User,
    tvSeriesId: number,
    dto: ReviewTvSeriesInputDto,
  }): Promise<ReviewTvSeriesDto> {
    const logEntry = await this.db.query.logTvSeries.findFirst({
      where: and(
        eq(logTvSeries.userId, user.id),
        eq(logTvSeries.tvSeriesId, tvSeriesId),
      ),
      columns: {
        id: true,
        rating: true,
      },
    });

    if (!logEntry) {
      throw new NotFoundException('Log entry not found');
    }

    const sanitizedBody = DOMPurify.sanitize(dto.body);
    const wrappedHtml = `<html>${sanitizedBody}</html>`;

    const [upsertedReview] = await this.db.insert(reviewTvSeries)
      .values({
        id: logEntry.id,
        title: dto.title ?? null,
        body: wrappedHtml,
        isSpoiler: dto.isSpoiler,
      })
      .onConflictDoUpdate({
        target: reviewTvSeries.id,
        set: {
          title: dto.title ?? null,
          body: wrappedHtml,
          isSpoiler: dto.isSpoiler,
        },
      })
      .returning();

    return plainToInstance(ReviewTvSeriesDto, {
      ...upsertedReview,
      userId: user.id,
      tvSeriesId: tvSeriesId,
    });
  }

  async delete({
    user,
    tvSeriesId,
  }: {
    user: User,
    tvSeriesId: number,
  }): Promise<ReviewTvSeriesDto> {
    const logEntry = await this.db.query.logTvSeries.findFirst({
      where: and(
        eq(logTvSeries.userId, user.id),
        eq(logTvSeries.tvSeriesId, tvSeriesId),
      ),
      columns: {
        id: true,
      },
    });

    if (!logEntry) {
      throw new NotFoundException('Log entry not found');
    }

    const [deletedReview] = await this.db.delete(reviewTvSeries)
      .where(eq(reviewTvSeries.id, logEntry.id))
      .returning();

    if (!deletedReview) {
      throw new NotFoundException('Review not found');
    }

    return plainToInstance(ReviewTvSeriesDto, {
      ...deletedReview,
      userId: user.id,
      tvSeriesId: tvSeriesId,
    });
  }

  /* ---------------------------------- List ---------------------------------- */
  private getListBaseQuery(
    tx: DbTransaction,
    tvSeriesId: number,
    currentUser: User | null,
    sortBy: ReviewTvSeriesSortBy,
    sortOrder: SortOrder,
  ) {
    const direction = sortOrder === SortOrder.ASC ? asc : desc;
    
    const orderBy = (() => {
      switch (sortBy) {
        case ReviewTvSeriesSortBy.RANDOM:
          return [sql`RANDOM()`];
        case ReviewTvSeriesSortBy.LIKES_COUNT:
          return [direction(reviewTvSeries.likesCount), direction(reviewTvSeries.id)];
        case ReviewTvSeriesSortBy.UPDATED_AT:
          return [direction(reviewTvSeries.updatedAt), direction(reviewTvSeries.id)];
        case ReviewTvSeriesSortBy.RATING:
          return [direction(logTvSeries.rating), direction(reviewTvSeries.id)]; 
        case ReviewTvSeriesSortBy.CREATED_AT:
        default:
          return [direction(reviewTvSeries.createdAt), direction(reviewTvSeries.id)];
      }
    })();

    let isVisibleLogic: SQL;

    if (!currentUser) {
      isVisibleLogic = eq(profile.isPrivate, false);
    } else {
      const isFollowingSubquery = tx
        .select({ is_following: sql<boolean>`true` })
        .from(follow)
        .where(
          and(
            eq(follow.followerId, currentUser.id),
            eq(follow.followingId, logTvSeries.userId), 
            eq(follow.status, 'accepted')
          )
        )
        .limit(1);

      isVisibleLogic = or(
        eq(profile.isPrivate, false),
        eq(logTvSeries.userId, currentUser.id),
        exists(isFollowingSubquery)
      );
    }

    const whereClause = and(
      eq(logTvSeries.tvSeriesId, tvSeriesId),
      isVisibleLogic
    );

    return { whereClause, orderBy };
  }
  async listPaginated({
    tvSeriesId,
    query,
    currentUser,
  }: {
    tvSeriesId: number;
    query: ListPaginatedReviewsTvSeriesQueryDto;
    currentUser: User | null;
  }): Promise<ListPaginatedReviewsTvSeriesDto> {
    return await this.db.transaction(async (tx) => {
      const { per_page, page, sort_by, sort_order } = query;
      const offset = (page - 1) * per_page;

      const { whereClause, orderBy } = this.getListBaseQuery(
        tx, tvSeriesId, currentUser, sort_by, sort_order
      );

      const [reviewsData, totalCountResult] = await Promise.all([
        tx.select({
            review: reviewTvSeries,
            log: logTvSeries,
            user: USER_COMPACT_SELECT,
          })
          .from(reviewTvSeries)
          .innerJoin(logTvSeries, eq(logTvSeries.id, reviewTvSeries.id))
          .innerJoin(user, eq(user.id, logTvSeries.userId))
          .innerJoin(profile, eq(profile.id, user.id))
          .where(whereClause)
          .orderBy(...orderBy)
          .limit(per_page)
          .offset(offset),
        tx.select({ count: sql<number>`count(*)` })
          .from(reviewTvSeries)
          .innerJoin(logTvSeries, eq(logTvSeries.id, reviewTvSeries.id))
          .innerJoin(profile, eq(profile.id, logTvSeries.userId))
          .where(whereClause)
      ]);

      const totalCount = Number(totalCountResult[0]?.count || 0);

      return plainToInstance(ListPaginatedReviewsTvSeriesDto, {
        data: reviewsData.map((row) => ({
          ...row.review,
          userId: row.log.userId,
          tvSeriesId: row.log.tvSeriesId,
          rating: row.log.rating,
          author: {
            id: row.user.id,
            name: row.user.name,
            username: row.user.username,
            avatar: row.user.avatar,
            isPremium: row.user.isPremium,
          }
        })),
        meta: {
          total_results: totalCount,
          total_pages: Math.ceil(totalCount / per_page),
          current_page: page,
          per_page,
        },
      });
    });
  };
  async listInfinite({
    tvSeriesId,
    query,
    currentUser,
  }: {
    tvSeriesId: number;
    query: ListInfiniteReviewsTvSeriesQueryDto;
    currentUser: User | null;
  }): Promise<ListInfiniteReviewsTvSeriesDto> {
    return await this.db.transaction(async (tx) => {
      const { per_page, sort_order, sort_by, cursor } = query;

      const cursorData = cursor ? decodeCursor<BaseCursor<string | number, number>>(cursor) : null;

      const { whereClause: baseWhereClause, orderBy } = this.getListBaseQuery(
        tx, tvSeriesId, currentUser, sort_by, sort_order
      );

      let cursorWhereClause: SQL | undefined;

      if (cursorData) {
        const operator = sort_order === SortOrder.ASC ? gt : lt;

        switch (sort_by) {
          case ReviewTvSeriesSortBy.LIKES_COUNT: {
            cursorWhereClause = or(
              operator(reviewTvSeries.likesCount, Number(cursorData.value)),
              and(
                eq(reviewTvSeries.likesCount, Number(cursorData.value)),
                operator(reviewTvSeries.id, cursorData.id)
              )
            );
            break;
          }

          case ReviewTvSeriesSortBy.RATING: {
            cursorWhereClause = or(
              operator(logTvSeries.rating, Number(cursorData.value)),
              and(
                eq(logTvSeries.rating, Number(cursorData.value)),
                operator(reviewTvSeries.id, cursorData.id)
              )
            );
            break;
          }

          case ReviewTvSeriesSortBy.UPDATED_AT: {
            const updatedDate = String(cursorData.value);
            cursorWhereClause = or(
              operator(reviewTvSeries.updatedAt, updatedDate),
              and(
                eq(reviewTvSeries.updatedAt, updatedDate),
                operator(reviewTvSeries.id, cursorData.id)
              )
            );
            break;
          }

          case ReviewTvSeriesSortBy.RANDOM:
            break;

          case ReviewTvSeriesSortBy.CREATED_AT:
          default: {
            const createdDate = String(cursorData.value);
            cursorWhereClause = or(
              operator(reviewTvSeries.createdAt, createdDate),
              and(
                eq(reviewTvSeries.createdAt, createdDate),
                operator(reviewTvSeries.id, cursorData.id)
              )
            );
            break;
          }
        }
      }

      const finalWhereClause = cursorWhereClause 
        ? and(baseWhereClause, cursorWhereClause) 
        : baseWhereClause;

      const fetchLimit = per_page + 1;

      const results = await tx.select({
          review: reviewTvSeries,
          log: logTvSeries,
          user: USER_COMPACT_SELECT,
        })
        .from(reviewTvSeries)
        .innerJoin(logTvSeries, eq(logTvSeries.id, reviewTvSeries.id))
        .innerJoin(user, eq(user.id, logTvSeries.userId))
        .innerJoin(profile, eq(profile.id, user.id))
        .where(finalWhereClause)
        .orderBy(...orderBy)
        .limit(fetchLimit);

      const hasNextPage = results.length > per_page;
      const paginatedResults = hasNextPage ? results.slice(0, per_page) : results;

      let nextCursor: string | null = null;

      if (hasNextPage) {
        const lastItem = paginatedResults[paginatedResults.length - 1];
        let cursorValue: string | number | null = null;

        switch (sort_by) {
          case ReviewTvSeriesSortBy.LIKES_COUNT:
            cursorValue = lastItem.review.likesCount ?? 0;
            break;
          case ReviewTvSeriesSortBy.RATING:
            cursorValue = lastItem.log.rating ?? 0;
            break;
          case ReviewTvSeriesSortBy.UPDATED_AT:
            cursorValue = lastItem.review.updatedAt;
            break;
          case ReviewTvSeriesSortBy.CREATED_AT:
          default:
            cursorValue = lastItem.review.createdAt;
            break;
        }

        if (cursorValue !== null) {
          nextCursor = encodeCursor<BaseCursor<string | number, number>>({
            value: cursorValue,
            id: lastItem.review.id,
          });
        }
      }

      return plainToInstance(ListInfiniteReviewsTvSeriesDto, {
        data: paginatedResults.map((row) => ({
          ...row.review,
          userId: row.log.userId,
          tvSeriesId: row.log.tvSeriesId,
          rating: row.log.rating,
          author: {
            id: row.user.id,
            name: row.user.name,
            username: row.user.username,
            avatar: row.user.avatar,
            isPremium: row.user.isPremium,
          }
        })),
        meta: {
          next_cursor: nextCursor,
          per_page,
        },
      });
    });
  }
}
