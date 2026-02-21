import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq, exists, gt, lt, or, SQL, sql } from 'drizzle-orm';
import { follow, logMovie, profile, reviewMovie, tmdbMovieView } from '@libs/db/schemas';
import { User } from '../../auth/auth.service';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle.module';
import { ListInfiniteUserMovieWithMovieDto, ListUserMovieWithMovieDto, UserMovieWithUserMovieDto } from './dto/user-movie.dto';
import { SupportedLocale } from '@libs/i18n';
import { ListInfiniteLogsMovieQueryDto, ListLogsMovieQueryDto, LogMovieSortBy } from '../../movies/log/dto/log-movie.dto';
import { DbTransaction } from '@libs/db';
import { SortOrder } from '../../../common/dto/sort.dto';
import { BaseCursor, decodeCursor, encodeCursor } from '../../../utils/cursor';

@Injectable()
export class UserMoviesService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  async get({
    userId,
    movieId,
    currentUser,
    locale,
  }: {
    userId: string;
    movieId: number;
    currentUser: User | null;
    locale: SupportedLocale;
  }): Promise<UserMovieWithUserMovieDto | null> {
    return await this.db.transaction(async (tx) => {
      if (currentUser?.id !== userId) {
        const targetProfile = await tx.query.profile.findFirst({
          where: eq(profile.id, userId)
        })

        if (!targetProfile) {
          throw new NotFoundException('User not found.');
        }

        if (targetProfile.isPrivate) {
          if (!currentUser) {
            throw new ForbiddenException('This account is private.');
          }

          const amIFollowing = await tx.query.follow.findFirst({
            where: and(
              eq(follow.followerId, currentUser.id),
              eq(follow.followingId, userId),
              eq(follow.status, 'accepted')
            ),
          });

          if (!amIFollowing) {
            throw new ForbiddenException('This account is private. Follow this user to see their activity.');
          }
        }
      }
      await tx.execute(
        sql`SELECT set_config('app.current_language', ${locale}, true)`
      );
      if (currentUser) {
        await tx.execute(
          sql`SELECT set_config('app.current_user_id', ${currentUser.id}, true)`
        );
      }
      const logEntry = await tx.query.logMovie.findFirst({
        where: and(
          eq(logMovie.userId, userId),
          eq(logMovie.movieId, movieId),
        ),
        with: {
          watchedDates: {
            columns: {
              id: true,
              watchedDate: true,
            },
          },
          review: true,
          user: {
            columns: {
              id: true,
              username: true,
              name: true,
              image: true,
            },
            with: {
              profile: {
                columns: {
                  isPremium: true,
                }
              }
            }
          }
        }
      });

      if (!logEntry) return null;

      const [movie] = await tx.select({
        id: tmdbMovieView.id,
        title: tmdbMovieView.title,
        posterPath: tmdbMovieView.posterPath,
        backdropPath: tmdbMovieView.backdropPath,
        slug: tmdbMovieView.slug,
        url: tmdbMovieView.url,
        directors: tmdbMovieView.directors,
        releaseDate: tmdbMovieView.releaseDate,
        voteAverage: tmdbMovieView.voteAverage,
        voteCount: tmdbMovieView.voteCount,
        genres: tmdbMovieView.genres,
        followerAvgRating: tmdbMovieView.followerAvgRating,
      })
      .from(tmdbMovieView)
      .where(eq(tmdbMovieView.id, movieId))
      .limit(1);
      
      if (!movie) throw new NotFoundException('Movie not found');

      const { user, review, ...logData } = logEntry;

      return {
        ...logData,
        review: review ? {
          ...review,
          userId: logData.userId,
          movieId: logData.movieId,
        } : null,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          avatar: user.image,
          isPremium: user.profile.isPremium,
        },
        movie: movie,
      }
    });
  }

  /* ---------------------------------- List ---------------------------------- */
  private async getListBaseQuery(
    tx: DbTransaction,
    userId: string,
    locale: SupportedLocale,
    currentUser: User | null,
    sortBy: LogMovieSortBy,
    sortOrder: SortOrder,
  ) {
    await tx.execute(sql`SELECT set_config('app.current_language', ${locale}, true)`);
    if (currentUser) {
      await tx.execute(sql`SELECT set_config('app.current_user_id', ${currentUser.id}, true)`);
    }
    const direction = sortOrder === 'asc' ? asc : desc;
    const orderBy = (() => {
      switch (sortBy) {
        case LogMovieSortBy.RANDOM:
          return [sql`RANDOM()`];
        case LogMovieSortBy.RATING:
          return sortOrder === 'asc' 
            ? [sql`${logMovie.rating} ASC NULLS LAST`, direction(logMovie.id)]
            : [sql`${logMovie.rating} DESC NULLS LAST`, direction(logMovie.id)];
        case LogMovieSortBy.FIRST_WATCHED_AT:
          return [direction(logMovie.firstWatchedAt), direction(logMovie.id)];
        case LogMovieSortBy.UPDATED_AT:
        default:
          return [direction(logMovie.updatedAt), direction(logMovie.id)];
      }
    })();

    let privacyClause: SQL | undefined;
    if (currentUser?.id !== userId) {
      const isPublicProfile = exists(
        tx.select({ id: profile.id })
          .from(profile)
          .where(and(eq(profile.id, userId), eq(profile.isPrivate, false)))
      );

      if (!currentUser) {
        privacyClause = isPublicProfile;
      } else {
        privacyClause = or(
          isPublicProfile,
          exists(
            tx.select({ id: follow.followerId })
              .from(follow)
              .where(and(
                eq(follow.followerId, currentUser.id),
                eq(follow.followingId, userId),
                eq(follow.status, 'accepted')
              ))
          )
        );
      }
    }

    const baseWhereConditions: SQL[] = [eq(logMovie.userId, userId)];
    if (privacyClause) baseWhereConditions.push(privacyClause);

    return { 
      whereClause: and(...baseWhereConditions), 
      orderBy 
    };
  }
  async list({
    userId,
    query,
    currentUser,
    locale,
  }: {
    userId: string;
    query: ListLogsMovieQueryDto;
    currentUser: User | null;
    locale: SupportedLocale;
  }): Promise<ListUserMovieWithMovieDto> {
    return await this.db.transaction(async (tx) => {
      const { per_page, page, sort_by, sort_order } = query;
      const offset = (page - 1) * per_page;
      const { whereClause, orderBy } = await this.getListBaseQuery(
        tx,
        userId,
        locale,
        currentUser,
        sort_by,
        sort_order
      );

      const paginatedLogsSubquery = tx
        .select()
        .from(logMovie)
        .where(whereClause)
        .orderBy(...orderBy)
        .limit(per_page)
        .offset(offset)
        .as('paginated_logs');

      const [results, totalCount] = await Promise.all([        
        tx.select({
            log: logMovie, 
            isReviewed: sql<boolean>`${reviewMovie.id} IS NOT NULL`,
            movie: {
              id: tmdbMovieView.id,
              title: tmdbMovieView.title,
              slug: tmdbMovieView.slug,
              url: tmdbMovieView.url,
              posterPath: tmdbMovieView.posterPath,
              backdropPath: tmdbMovieView.backdropPath,
              directors: tmdbMovieView.directors,
              releaseDate: tmdbMovieView.releaseDate,
              voteAverage: tmdbMovieView.voteAverage,
              voteCount: tmdbMovieView.voteCount,
              genres: tmdbMovieView.genres,
              followerAvgRating: tmdbMovieView.followerAvgRating,
            },
          })
          .from(paginatedLogsSubquery)
          .innerJoin(logMovie, eq(logMovie.id, paginatedLogsSubquery.id)) 
          .innerJoin(tmdbMovieView, eq(logMovie.movieId, tmdbMovieView.id))
          .leftJoin(reviewMovie, eq(logMovie.id, reviewMovie.id))
          .orderBy(...orderBy),
        tx.$count(logMovie, whereClause)
      ]);

      return {
        data: results.map(({ log, movie, isReviewed }) => ({
          ...log,
          isReviewed,
          movie,
        })),
        meta: {
          total_results: totalCount,
          total_pages: Math.ceil(totalCount / per_page),
          current_page: page,
          per_page,
        }
      }
    });
  }
  async listInfinite({
    userId,
    query,
    currentUser,
    locale,
  }: {
    userId: string;
    query: ListInfiniteLogsMovieQueryDto;
    currentUser: User | null;
    locale: SupportedLocale;
  }): Promise<ListInfiniteUserMovieWithMovieDto> {
    return await this.db.transaction(async (tx) => {
      const { per_page, sort_order, sort_by, cursor } = query;

      const cursorData = cursor ? decodeCursor<BaseCursor<string | number, number>>(cursor) : null;

      const { whereClause: baseWhereClause, orderBy } = await this.getListBaseQuery(
        tx,
        userId,
        locale,
        currentUser,
        sort_by,
        sort_order
      );

      let cursorWhereClause: SQL | undefined;

      if (cursorData) {
        const operator = sort_order === SortOrder.ASC ? gt : lt;

        switch (sort_by) {
          case LogMovieSortBy.RATING:
            cursorWhereClause = or(
              operator(logMovie.rating, Number(cursorData.value)),
              and(
                eq(logMovie.rating, Number(cursorData.value)),
                operator(logMovie.id, cursorData.id)
              )
            );
            break;

          case LogMovieSortBy.FIRST_WATCHED_AT: {
            const firstWatchedDate = new Date(cursorData.value);
            cursorWhereClause = or(
              operator(logMovie.firstWatchedAt, firstWatchedDate),
              and(
                eq(logMovie.firstWatchedAt, firstWatchedDate),
                operator(logMovie.id, cursorData.id)
              )
            );
            break;
          }

          case LogMovieSortBy.RANDOM:
            break;

          case LogMovieSortBy.UPDATED_AT:
          default: {
            const updatedDate = new Date(cursorData.value);
            cursorWhereClause = or(
              operator(logMovie.updatedAt, updatedDate),
              and(
                eq(logMovie.updatedAt, updatedDate),
                operator(logMovie.id, cursorData.id)
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

      const paginatedLogsSubquery = tx.select()
        .from(logMovie)
        .where(finalWhereClause)
        .orderBy(...orderBy)
        .limit(fetchLimit)
        .as('paginated_logs');
      
      const results = await tx.select({
        log: logMovie, 
        isReviewed: sql<boolean>`${reviewMovie.id} IS NOT NULL`,
        movie: {
          id: tmdbMovieView.id,
          title: tmdbMovieView.title,
          slug: tmdbMovieView.slug,
          url: tmdbMovieView.url,
          posterPath: tmdbMovieView.posterPath,
          backdropPath: tmdbMovieView.backdropPath,
          directors: tmdbMovieView.directors,
          releaseDate: tmdbMovieView.releaseDate,
          voteAverage: tmdbMovieView.voteAverage,
          voteCount: tmdbMovieView.voteCount,
          genres: tmdbMovieView.genres,
          followerAvgRating: tmdbMovieView.followerAvgRating,
        },
      })
      .from(paginatedLogsSubquery)
      .innerJoin(logMovie, eq(logMovie.id, paginatedLogsSubquery.id)) 
      .innerJoin(tmdbMovieView, eq(logMovie.movieId, tmdbMovieView.id))
      .leftJoin(reviewMovie, eq(logMovie.id, reviewMovie.id))
      .orderBy(...orderBy);
      
      const hasNextPage = results.length > per_page;
      const paginatedResults = hasNextPage ? results.slice(0, per_page) : results;

      let nextCursor: string | null = null;

      if (hasNextPage) {
        const lastItem = paginatedResults[paginatedResults.length - 1].log;
        let cursorValue: string | number | null = null;

        switch (sort_by) {
          case LogMovieSortBy.RATING:
            cursorValue = lastItem.rating ?? 0;
            break;
          case LogMovieSortBy.FIRST_WATCHED_AT:
            cursorValue = lastItem.firstWatchedAt?.toISOString() ?? new Date(0).toISOString();
            break;
          case LogMovieSortBy.UPDATED_AT:
          default:
            cursorValue = lastItem.updatedAt.toISOString();
            break;
        }

        if (cursorValue !== null) {
          nextCursor = encodeCursor<BaseCursor<string | number, number>>({
            value: cursorValue,
            id: lastItem.id,
          });
        }
      }
      return {
        data: paginatedResults.map(({ log, movie, isReviewed }) => ({
          ...log,
          isReviewed,
          movie,
        })),
        meta: {
          next_cursor: nextCursor,
          per_page,
        }
      }
    });
  }
}
