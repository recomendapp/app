import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq, exists, gt, lt, or, SQL, sql } from 'drizzle-orm';
import { follow, logTvSeries, profile, reviewTvSeries, tmdbTvSeriesView } from '@libs/db/schemas';
import { User } from '../../auth/auth.service';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle/drizzle.module';
import { SupportedLocale } from '@libs/i18n';
import { DbTransaction } from '@libs/db';
import { SortOrder } from '../../../common/dto/sort.dto';
import { BaseCursor, decodeCursor, encodeCursor } from '../../../utils/cursor';
import { plainToInstance } from 'class-transformer';
import { ListInfiniteUserTvSeriesWithTvSeriesDto, ListPaginatedUserTvSeriesWithTvSeriesDto, UserTvSeriesWithUserTvSeriesDto } from './user-tv-series.dto';
import { TV_SERIES_COMPACT_SELECT } from '@libs/db/selectors';
import { ListInfiniteLogsTvSeriesQueryDto, ListPaginatedLogsTvSeriesQueryDto, LogTvSeriesSortBy } from '../../tv-series/logs/tv-series-logs.dto';

@Injectable()
export class UserTvSeriesService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  async get({
    userId,
    tvSeriesId,
    currentUser,
    locale,
  }: {
    userId: string;
    tvSeriesId: number;
    currentUser: User | null;
    locale: SupportedLocale;
  }): Promise<UserTvSeriesWithUserTvSeriesDto | null> {
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
      const logEntry = await tx.query.logTvSeries.findFirst({
        where: and(
          eq(logTvSeries.userId, userId),
          eq(logTvSeries.tvSeriesId, tvSeriesId),
        ),
        with: {
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

      const [tvSeries] = await tx.select(TV_SERIES_COMPACT_SELECT)
      .from(tmdbTvSeriesView)
      .where(eq(tmdbTvSeriesView.id, tvSeriesId))
      .limit(1);
      
      if (!tvSeries) throw new NotFoundException('TV series not found');

      const { user, review, ...logData } = logEntry;

      return plainToInstance(UserTvSeriesWithUserTvSeriesDto, {
        ...logData,
        review: review ? {
          ...review,
          userId: logData.userId,
          tvSeriesId: logData.tvSeriesId,
        } : null,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          avatar: user.image,
          isPremium: user.profile.isPremium,
        },
        tvSeries: tvSeries,
      });
    });
  }

  /* ---------------------------------- List ---------------------------------- */
  private async getListBaseQuery(
    tx: DbTransaction,
    userId: string,
    locale: SupportedLocale,
    currentUser: User | null,
    sortBy: LogTvSeriesSortBy,
    sortOrder: SortOrder,
  ) {
    await tx.execute(sql`SELECT set_config('app.current_language', ${locale}, true)`);
    if (currentUser) {
      await tx.execute(sql`SELECT set_config('app.current_user_id', ${currentUser.id}, true)`);
    }
    const direction = sortOrder === 'asc' ? asc : desc;
    const orderBy = (() => {
      switch (sortBy) {
        case LogTvSeriesSortBy.RANDOM:
          return [sql`RANDOM()`];
        case LogTvSeriesSortBy.RATING:
          return sortOrder === 'asc' 
            ? [sql`${logTvSeries.rating} ASC NULLS LAST`, direction(logTvSeries.id)]
            : [sql`${logTvSeries.rating} DESC NULLS LAST`, direction(logTvSeries.id)];
        case LogTvSeriesSortBy.UPDATED_AT:
        default:
          return [direction(logTvSeries.updatedAt), direction(logTvSeries.id)];
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

    const baseWhereConditions: SQL[] = [eq(logTvSeries.userId, userId)];
    if (privacyClause) baseWhereConditions.push(privacyClause);

    return { 
      whereClause: and(...baseWhereConditions), 
      orderBy 
    };
  }
  async listPaginated({
    userId,
    query,
    currentUser,
    locale,
  }: {
    userId: string;
    query: ListPaginatedLogsTvSeriesQueryDto;
    currentUser: User | null;
    locale: SupportedLocale;
  }): Promise<ListPaginatedUserTvSeriesWithTvSeriesDto> {
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
        .from(logTvSeries)
        .where(whereClause)
        .orderBy(...orderBy)
        .limit(per_page)
        .offset(offset)
        .as('paginated_logs');

      const [results, totalCount] = await Promise.all([        
        tx.select({
            log: logTvSeries, 
            isReviewed: sql<boolean>`${reviewTvSeries.id} IS NOT NULL`,
            tvSeries: TV_SERIES_COMPACT_SELECT,
          })
          .from(paginatedLogsSubquery)
          .innerJoin(logTvSeries, eq(logTvSeries.id, paginatedLogsSubquery.id)) 
          .innerJoin(tmdbTvSeriesView, eq(logTvSeries.tvSeriesId, tmdbTvSeriesView.id))
          .leftJoin(reviewTvSeries, eq(logTvSeries.id, reviewTvSeries.id))
          .orderBy(...orderBy),
        tx.$count(logTvSeries, whereClause)
      ]);

      return plainToInstance(ListPaginatedUserTvSeriesWithTvSeriesDto, {
        data: results.map(({ log, tvSeries, isReviewed }) => ({
          ...log,
          isReviewed,
          tvSeries,
        })),
        meta: {
          total_results: totalCount,
          total_pages: Math.ceil(totalCount / per_page),
          current_page: page,
          per_page,
        }
      });
    });
  }
  async listInfinite({
    userId,
    query,
    currentUser,
    locale,
  }: {
    userId: string;
    query: ListInfiniteLogsTvSeriesQueryDto;
    currentUser: User | null;
    locale: SupportedLocale;
  }): Promise<ListInfiniteUserTvSeriesWithTvSeriesDto> {
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
          case LogTvSeriesSortBy.RATING:
            cursorWhereClause = or(
              operator(logTvSeries.rating, Number(cursorData.value)),
              and(
                eq(logTvSeries.rating, Number(cursorData.value)),
                operator(logTvSeries.id, cursorData.id)
              )
            );
            break;

          case LogTvSeriesSortBy.RANDOM:
            break;

          case LogTvSeriesSortBy.UPDATED_AT:
          default: {
            const updatedDate = String(cursorData.value);
            cursorWhereClause = or(
              operator(logTvSeries.updatedAt, updatedDate),
              and(
                eq(logTvSeries.updatedAt, updatedDate),
                operator(logTvSeries.id, cursorData.id)
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
        .from(logTvSeries)
        .where(finalWhereClause)
        .orderBy(...orderBy)
        .limit(fetchLimit)
        .as('paginated_logs');
      
      const results = await tx.select({
        log: logTvSeries, 
        isReviewed: sql<boolean>`${reviewTvSeries.id} IS NOT NULL`,
        tvSeries: TV_SERIES_COMPACT_SELECT,
      })
      .from(paginatedLogsSubquery)
      .innerJoin(logTvSeries, eq(logTvSeries.id, paginatedLogsSubquery.id)) 
      .innerJoin(tmdbTvSeriesView, eq(logTvSeries.tvSeriesId, tmdbTvSeriesView.id))
      .leftJoin(reviewTvSeries, eq(logTvSeries.id, reviewTvSeries.id))
      .orderBy(...orderBy);
      
      const hasNextPage = results.length > per_page;
      const paginatedResults = hasNextPage ? results.slice(0, per_page) : results;

      let nextCursor: string | null = null;

      if (hasNextPage) {
        const lastItem = paginatedResults[paginatedResults.length - 1].log;
        let cursorValue: string | number | null = null;

        switch (sort_by) {
          case LogTvSeriesSortBy.RATING:
            cursorValue = lastItem.rating ?? 0;
            break;
          case LogTvSeriesSortBy.UPDATED_AT:
          default:
            cursorValue = lastItem.updatedAt;
            break;
        }

        if (cursorValue !== null) {
          nextCursor = encodeCursor<BaseCursor<string | number, number>>({
            value: cursorValue,
            id: lastItem.id,
          });
        }
      }
      return plainToInstance(ListInfiniteUserTvSeriesWithTvSeriesDto, {
        data: paginatedResults.map(({ log, tvSeries, isReviewed }) => ({
          ...log,
          isReviewed,
          tvSeries,
        })),
        meta: {
          next_cursor: nextCursor,
          per_page,
        }
      });
    });
  }
}
