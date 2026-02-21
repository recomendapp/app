import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq, exists, gt, lt, or, sql, SQL } from 'drizzle-orm';
import { follow, logMovie, profile, reviewMovie, user } from '@libs/db/schemas';
import { User } from '../../auth/auth.service';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle.module';
import { ListInfiniteReviewsMovieDto, ListInfiniteReviewsMovieQueryDto, ListReviewsMovieDto, ListReviewsMovieQueryDto, ReviewMovieDto, ReviewMovieInputDto, ReviewMovieSortBy } from '../../reviews/movie/dto/reviews-movie.dto';
import DOMPurify from 'isomorphic-dompurify';
import { SortOrder } from '../../../common/dto/sort.dto';
import { DbTransaction } from '@libs/db';
import { BaseCursor, decodeCursor, encodeCursor } from '../../../utils/cursor';

@Injectable()
export class MovieReviewsService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  async upsert({
    user,
    movieId,
    dto,
  }: {
    user: User,
    movieId: number,
    dto: ReviewMovieInputDto,
  }): Promise<ReviewMovieDto> {
    const logEntry = await this.db.query.logMovie.findFirst({
      where: and(
        eq(logMovie.userId, user.id),
        eq(logMovie.movieId, movieId),
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

    const [upsertedReview] = await this.db.insert(reviewMovie)
      .values({
        id: logEntry.id,
        title: dto.title ?? null,
        body: wrappedHtml,
        isSpoiler: dto.isSpoiler,
      })
      .onConflictDoUpdate({
        target: reviewMovie.id,
        set: {
          title: dto.title ?? null,
          body: wrappedHtml,
          isSpoiler: dto.isSpoiler,
        },
      })
      .returning();

    return {
      ...upsertedReview,
      userId: user.id,
      movieId: movieId,
    };
  }

  async delete({
    user,
    movieId,
  }: {
    user: User,
    movieId: number,
  }): Promise<ReviewMovieDto> {
    const logEntry = await this.db.query.logMovie.findFirst({
      where: and(
        eq(logMovie.userId, user.id),
        eq(logMovie.movieId, movieId),
      ),
      columns: {
        id: true,
      },
    });

    if (!logEntry) {
      throw new NotFoundException('Log entry not found');
    }

    const [deletedReview] = await this.db.delete(reviewMovie)
      .where(eq(reviewMovie.id, logEntry.id))
      .returning();

    if (!deletedReview) {
      throw new NotFoundException('Review not found');
    }

    return {
      ...deletedReview,
      userId: user.id,
      movieId: movieId,
    };
  }

  /* ---------------------------------- List ---------------------------------- */
  private getListBaseQuery(
    tx: DbTransaction,
    movieId: number,
    currentUser: User | null,
    sortBy: ReviewMovieSortBy,
    sortOrder: SortOrder,
  ) {
    const direction = sortOrder === SortOrder.ASC ? asc : desc;
    
    const orderBy = (() => {
      switch (sortBy) {
        case ReviewMovieSortBy.RANDOM:
          return [sql`RANDOM()`];
        case ReviewMovieSortBy.LIKES_COUNT:
          return [direction(reviewMovie.likesCount), direction(reviewMovie.id)];
        case ReviewMovieSortBy.UPDATED_AT:
          return [direction(reviewMovie.updatedAt), direction(reviewMovie.id)];
        case ReviewMovieSortBy.RATING:
          return [direction(logMovie.rating), direction(reviewMovie.id)]; 
        case ReviewMovieSortBy.CREATED_AT:
        default:
          return [direction(reviewMovie.createdAt), direction(reviewMovie.id)];
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
            eq(follow.followingId, logMovie.userId), 
            eq(follow.status, 'accepted')
          )
        )
        .limit(1);

      isVisibleLogic = or(
        eq(profile.isPrivate, false),
        eq(logMovie.userId, currentUser.id),
        exists(isFollowingSubquery)
      );
    }

    const whereClause = and(
      eq(logMovie.movieId, movieId),
      isVisibleLogic
    );

    return { whereClause, orderBy };
  }
  async list({
    movieId,
    query,
    currentUser,
  }: {
    movieId: number;
    query: ListReviewsMovieQueryDto;
    currentUser: User | null;
  }): Promise<ListReviewsMovieDto> {
    return await this.db.transaction(async (tx) => {
      const { per_page, page, sort_by, sort_order } = query;
      const offset = (page - 1) * per_page;

      const { whereClause, orderBy } = this.getListBaseQuery(
        tx, movieId, currentUser, sort_by, sort_order
      );

      const [reviewsData, totalCountResult] = await Promise.all([
        tx.select({
            review: reviewMovie,
            log: logMovie,
            user: {
              id: user.id,
              name: user.name,
              username: user.username,
              avatar: user.image,
              isPremium: profile.isPremium,
            }
          })
          .from(reviewMovie)
          .innerJoin(logMovie, eq(logMovie.id, reviewMovie.id))
          .innerJoin(user, eq(user.id, logMovie.userId))
          .innerJoin(profile, eq(profile.id, user.id))
          .where(whereClause)
          .orderBy(...orderBy)
          .limit(per_page)
          .offset(offset),
        tx.select({ count: sql<number>`count(*)` })
          .from(reviewMovie)
          .innerJoin(logMovie, eq(logMovie.id, reviewMovie.id))
          .innerJoin(profile, eq(profile.id, logMovie.userId))
          .where(whereClause)
      ]);

      const totalCount = Number(totalCountResult[0]?.count || 0);

      return {
        data: reviewsData.map((row) => ({
          ...row.review,
          userId: row.log.userId,
          movieId: row.log.movieId,
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
      };
    });
  };
  async listInfinite({
    movieId,
    query,
    currentUser,
  }: {
    movieId: number;
    query: ListInfiniteReviewsMovieQueryDto;
    currentUser: User | null;
  }): Promise<ListInfiniteReviewsMovieDto> {
    return await this.db.transaction(async (tx) => {
      const { per_page, sort_order, sort_by, cursor } = query;

      const cursorData = cursor ? decodeCursor<BaseCursor<string | number, number>>(cursor) : null;

      const { whereClause: baseWhereClause, orderBy } = this.getListBaseQuery(
        tx, movieId, currentUser, sort_by, sort_order
      );

      let cursorWhereClause: SQL | undefined;

      if (cursorData) {
        const operator = sort_order === SortOrder.ASC ? gt : lt;

        switch (sort_by) {
          case ReviewMovieSortBy.LIKES_COUNT: {
            cursorWhereClause = or(
              operator(reviewMovie.likesCount, Number(cursorData.value)),
              and(
                eq(reviewMovie.likesCount, Number(cursorData.value)),
                operator(reviewMovie.id, cursorData.id)
              )
            );
            break;
          }

          case ReviewMovieSortBy.RATING: {
            cursorWhereClause = or(
              operator(logMovie.rating, Number(cursorData.value)),
              and(
                eq(logMovie.rating, Number(cursorData.value)),
                operator(reviewMovie.id, cursorData.id)
              )
            );
            break;
          }

          case ReviewMovieSortBy.UPDATED_AT: {
            const updatedDate = new Date(cursorData.value as string);
            cursorWhereClause = or(
              operator(reviewMovie.updatedAt, updatedDate),
              and(
                eq(reviewMovie.updatedAt, updatedDate),
                operator(reviewMovie.id, cursorData.id)
              )
            );
            break;
          }

          case ReviewMovieSortBy.RANDOM:
            break;

          case ReviewMovieSortBy.CREATED_AT:
          default: {
            const createdDate = new Date(cursorData.value as string);
            cursorWhereClause = or(
              operator(reviewMovie.createdAt, createdDate),
              and(
                eq(reviewMovie.createdAt, createdDate),
                operator(reviewMovie.id, cursorData.id)
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
          review: reviewMovie,
          log: logMovie,
          user: {
            id: user.id,
            name: user.name,
            username: user.username,
            avatar: user.image,
            isPremium: profile.isPremium,
          }
        })
        .from(reviewMovie)
        .innerJoin(logMovie, eq(logMovie.id, reviewMovie.id))
        .innerJoin(user, eq(user.id, logMovie.userId))
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
          case ReviewMovieSortBy.LIKES_COUNT:
            cursorValue = lastItem.review.likesCount ?? 0;
            break;
          case ReviewMovieSortBy.RATING:
            cursorValue = lastItem.log.rating ?? 0;
            break;
          case ReviewMovieSortBy.UPDATED_AT:
            cursorValue = lastItem.review.updatedAt.toISOString();
            break;
          case ReviewMovieSortBy.CREATED_AT:
          default:
            cursorValue = lastItem.review.createdAt.toISOString();
            break;
        }

        if (cursorValue !== null) {
          nextCursor = encodeCursor<BaseCursor<string | number, number>>({
            value: cursorValue,
            id: lastItem.review.id,
          });
        }
      }

      return {
        data: paginatedResults.map((row) => ({
          ...row.review,
          userId: row.log.userId,
          movieId: row.log.movieId,
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
      };
    });
  }
}
