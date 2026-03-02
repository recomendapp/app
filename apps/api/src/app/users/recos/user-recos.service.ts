import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, gt, lt, or, SQL, sql } from 'drizzle-orm';
import { profile, reco, recoStatusEnum, recoTypeEnum, tmdbMovieView, tmdbTvSeriesView, user } from '@libs/db/schemas';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle.module';
import { SupportedLocale } from '@libs/i18n';
import { SortOrder } from '../../../common/dto/sort.dto';
import { DbTransaction } from '@libs/db';
import { BaseCursor, decodeCursor, encodeCursor } from '../../../utils/cursor';
import { ListAllRecosQueryDto, ListInfiniteRecosQueryDto, ListPaginatedRecosQueryDto, RecoSortBy, RecoType, RecoWithMediaUnion } from '../../recos/dto/recos.dto';
import { UserSummaryDto } from '../dto/users.dto';
import { User } from '../../auth/auth.service';

@Injectable()
export class UserRecosService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  private getListBaseQuery(tx: DbTransaction, targetUserId: string, status: typeof recoStatusEnum.enumValues[number], type?: typeof recoTypeEnum.enumValues[number]) {
    const whereConditions = [
      eq(reco.userId, targetUserId),
      eq(reco.status, status)
    ];

    if (type) {
      whereConditions.push(eq(reco.type, type));
    }

    return tx.select({
        mediaId: sql<number>`COALESCE(${reco.movieId}, ${reco.tvSeriesId})`.as('media_id'),
        type: reco.type,
        firstSendAt: sql<string>`MIN(${reco.createdAt})`.as('first_send_at'),
        lastSendAt: sql<string>`MAX(${reco.createdAt})`.as('last_send_at'),
        senderCount: sql<number>`COUNT(DISTINCT ${reco.senderId})`.as('sender_count'),
        senders: sql<(Pick<typeof reco.$inferSelect, 'id' | 'comment' | 'createdAt'> & { user: UserSummaryDto })[]>`
          json_agg(
            json_build_object(
              'id', ${reco.id},
              'comment', ${reco.comment},
              'createdAt', ${reco.createdAt},
              'user', json_build_object(
                'id', ${user.id},
                'username', ${user.username},
                'name', ${user.name},
                'avatar', ${user.image},
                'isPremium', ${profile.isPremium}
              )
            ) ORDER BY ${reco.createdAt} DESC
          )
        `.as('senders')
      })
      .from(reco)
      .innerJoin(user, eq(user.id, reco.senderId))
      .innerJoin(profile, eq(profile.id, reco.senderId))
      .where(and(...whereConditions))
      .groupBy(reco.type, sql`COALESCE(${reco.movieId}, ${reco.tvSeriesId})`)
      .as('grouped_recos');
  }
  async listAll({
    targetUserId,
    query,
    locale,
    currentUser,
  }: {
    targetUserId: string;
    query: ListAllRecosQueryDto;
    locale: SupportedLocale;
    currentUser: User | null;
  }): Promise<RecoWithMediaUnion[]> {
    const { sort_order, sort_by, status, type } = query;

    return await this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_language', ${locale}, true)`);

      const groupedRecosSq = this.getListBaseQuery(tx, targetUserId, status, type);
      
      const direction = sort_order === SortOrder.ASC ? asc : desc;
      const orderBy = (() => {
        switch (sort_by) {
          case RecoSortBy.RANDOM: return [sql`RANDOM()`];
          case RecoSortBy.LAST_SEND_AT: return [direction(groupedRecosSq.lastSendAt), direction(groupedRecosSq.mediaId)];
          case RecoSortBy.SENDER_COUNT: return [direction(groupedRecosSq.senderCount), direction(groupedRecosSq.mediaId)];
          case RecoSortBy.FIRST_SEND_AT:
          default: return [direction(groupedRecosSq.firstSendAt), direction(groupedRecosSq.mediaId)];
        }
      })();

      const results = await tx.select({
          grouped: {
            mediaId: groupedRecosSq.mediaId,
            type: groupedRecosSq.type,
            senders: groupedRecosSq.senders,
            lastSendAt: groupedRecosSq.lastSendAt,
            senderCount: groupedRecosSq.senderCount,
            firstSendAt: groupedRecosSq.firstSendAt,
          },
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
            popularity: tmdbMovieView.popularity,
            genres: tmdbMovieView.genres,
            followerAvgRating: tmdbMovieView.followerAvgRating,
          },
          tvSeries: {
            id: tmdbTvSeriesView.id,
            name: tmdbTvSeriesView.name,
            slug: tmdbTvSeriesView.slug,
            url: tmdbTvSeriesView.url,
            posterPath: tmdbTvSeriesView.posterPath,
            backdropPath: tmdbTvSeriesView.backdropPath,
            createdBy: tmdbTvSeriesView.createdBy,
            firstAirDate: tmdbTvSeriesView.firstAirDate,
            lastAirDate: tmdbTvSeriesView.lastAirDate,
            voteAverage: tmdbTvSeriesView.voteAverage,
            voteCount: tmdbTvSeriesView.voteCount,
            popularity: tmdbTvSeriesView.popularity,
            genres: tmdbTvSeriesView.genres,
            followerAvgRating: tmdbTvSeriesView.followerAvgRating,
          },
        })
        .from(groupedRecosSq)
        .leftJoin(tmdbMovieView, and(eq(groupedRecosSq.type, 'movie'), eq(groupedRecosSq.mediaId, tmdbMovieView.id)))
        .leftJoin(tmdbTvSeriesView, and(eq(groupedRecosSq.type, 'tv_series'), eq(groupedRecosSq.mediaId, tmdbTvSeriesView.id)))
        .orderBy(...orderBy);

      return results.map((row) => {
        const base = {
          mediaId: row.grouped.mediaId,
          type: row.grouped.type,
          senders: row.grouped.senders,
          latestCreatedAt: row.grouped.lastSendAt,
        };

        if (base.type === RecoType.MOVIE && row.movie) {
          return { ...base, type: RecoType.MOVIE, media: row.movie };
        } 
        else {
          return { ...base, type: RecoType.TV_SERIES, media: row.tvSeries };
        }
      });
    });
  }
  async listPaginated({
    targetUserId,
    query,
    locale,
    currentUser,
  }: {
    targetUserId: string;
    query: ListPaginatedRecosQueryDto;
    locale: SupportedLocale;
    currentUser: User | null;
  }) {
    const { per_page, page, sort_order, sort_by, status, type } = query;
    const offset = (page - 1) * per_page;

    return await this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_language', ${locale}, true)`);

      const groupedRecosSq = this.getListBaseQuery(tx, targetUserId, status, type);
      
      const direction = sort_order === SortOrder.ASC ? asc : desc;
      const orderBy = (() => {
        switch (sort_by) {
          case RecoSortBy.RANDOM: return [sql`RANDOM()`];
          case RecoSortBy.LAST_SEND_AT: return [direction(groupedRecosSq.lastSendAt), direction(groupedRecosSq.mediaId)];
          case RecoSortBy.SENDER_COUNT: return [direction(groupedRecosSq.senderCount), direction(groupedRecosSq.mediaId)];
          case RecoSortBy.FIRST_SEND_AT:
          default: return [direction(groupedRecosSq.firstSendAt), direction(groupedRecosSq.mediaId)];
        }
      })();

      const [results, [{ count: totalCount }]] = await Promise.all([
        tx.select({
            grouped: {
              mediaId: groupedRecosSq.mediaId,
              type: groupedRecosSq.type,
              senders: groupedRecosSq.senders,
              lastSendAt: groupedRecosSq.lastSendAt,
            },
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
              popularity: tmdbMovieView.popularity,
              genres: tmdbMovieView.genres,
              followerAvgRating: tmdbMovieView.followerAvgRating,
            },
            tvSeries: {
              id: tmdbTvSeriesView.id,
              name: tmdbTvSeriesView.name,
              slug: tmdbTvSeriesView.slug,
              url: tmdbTvSeriesView.url,
              posterPath: tmdbTvSeriesView.posterPath,
              backdropPath: tmdbTvSeriesView.backdropPath,
              createdBy: tmdbTvSeriesView.createdBy,
              firstAirDate: tmdbTvSeriesView.firstAirDate,
              lastAirDate: tmdbTvSeriesView.lastAirDate,
              voteAverage: tmdbTvSeriesView.voteAverage,
              voteCount: tmdbTvSeriesView.voteCount,
              popularity: tmdbTvSeriesView.popularity,
              genres: tmdbTvSeriesView.genres,
              followerAvgRating: tmdbTvSeriesView.followerAvgRating,
            },
          })
          .from(groupedRecosSq)
          .leftJoin(tmdbMovieView, and(eq(groupedRecosSq.type, 'movie'), eq(groupedRecosSq.mediaId, tmdbMovieView.id)))
          .leftJoin(tmdbTvSeriesView, and(eq(groupedRecosSq.type, 'tv_series'), eq(groupedRecosSq.mediaId, tmdbTvSeriesView.id)))
          .orderBy(...orderBy)
          .limit(per_page)
          .offset(offset),
          
        tx.select({ count: sql<number>`COUNT(DISTINCT CONCAT(${reco.type}, '_', COALESCE(${reco.movieId}, ${reco.tvSeriesId})))` })
          .from(reco)
          .where(
            and(
              eq(reco.userId, targetUserId), 
              eq(reco.status, status),
              type ? eq(reco.type, type) : undefined
            )
          )
      ]);

      const mappedData: RecoWithMediaUnion[] = results.map((row) => {
        const base = {
          mediaId: row.grouped.mediaId,
          type: row.grouped.type,
          senders: row.grouped.senders,
          latestCreatedAt: row.grouped.lastSendAt,
        };

        if (base.type === RecoType.MOVIE && row.movie) {
          return { ...base, type: RecoType.MOVIE, media: row.movie };
        } else {
          return { ...base, type: RecoType.TV_SERIES, media: row.tvSeries };
        }
      });

      return {
        data: mappedData,
        meta: {
          total_results: Number(totalCount),
          total_pages: Math.ceil(Number(totalCount) / per_page),
          current_page: page,
          per_page,
        },
      };
    });
  }
  async listInfinite({
    targetUserId,
    query,
    locale,
    currentUser,
  }: {
    targetUserId: string;
    query: ListInfiniteRecosQueryDto;
    locale: SupportedLocale;
    currentUser: User | null;
  }) {
    const { per_page, sort_order, sort_by, cursor, status, type } = query;
    const cursorData = cursor ? decodeCursor<BaseCursor<string | number, number>>(cursor) : null;

    return await this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_language', ${locale}, true)`);

      const groupedRecosSq = this.getListBaseQuery(tx, targetUserId, status, type);
      
      const direction = sort_order === SortOrder.ASC ? asc : desc;
      const orderBy = (() => {
        switch (sort_by) {
          case RecoSortBy.RANDOM: return [sql`RANDOM()`];
          case RecoSortBy.LAST_SEND_AT: return [direction(groupedRecosSq.lastSendAt), direction(groupedRecosSq.mediaId)];
          case RecoSortBy.SENDER_COUNT: return [direction(groupedRecosSq.senderCount), direction(groupedRecosSq.mediaId)];
          case RecoSortBy.FIRST_SEND_AT:
          default: return [direction(groupedRecosSq.firstSendAt), direction(groupedRecosSq.mediaId)];
        }
      })();

      let cursorWhereClause: SQL | undefined;

      if (cursorData) {
        const operator = sort_order === SortOrder.ASC ? gt : lt;

        switch (sort_by) {
          case RecoSortBy.SENDER_COUNT: {
            const countValue = Number(cursorData.value);
            cursorWhereClause = or(
              operator(groupedRecosSq.senderCount, countValue),
              and(
                eq(groupedRecosSq.senderCount, countValue),
                operator(groupedRecosSq.mediaId, cursorData.id)
              )
            );
            break;
          }
          case RecoSortBy.LAST_SEND_AT: {
            const dateValue = String(cursorData.value);
            cursorWhereClause = or(
              operator(groupedRecosSq.lastSendAt, dateValue),
              and(
                eq(groupedRecosSq.lastSendAt, dateValue),
                operator(groupedRecosSq.mediaId, cursorData.id)
              )
            );
            break;
          }
          case RecoSortBy.RANDOM:
            break;
          case RecoSortBy.FIRST_SEND_AT:
          default: {
            const dateValue = String(cursorData.value);
            cursorWhereClause = or(
              operator(groupedRecosSq.firstSendAt, dateValue),
              and(
                eq(groupedRecosSq.firstSendAt, dateValue),
                operator(groupedRecosSq.mediaId, cursorData.id)
              )
            );
            break;
          }
        }
      }

      const fetchLimit = per_page + 1;

      const [results, totalCountResult] = await Promise.all([
        tx.select({
            grouped: {
              mediaId: groupedRecosSq.mediaId,
              type: groupedRecosSq.type,
              senders: groupedRecosSq.senders,
              lastSendAt: groupedRecosSq.lastSendAt,
              senderCount: groupedRecosSq.senderCount,
              firstSendAt: groupedRecosSq.firstSendAt,
            },
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
              popularity: tmdbMovieView.popularity,
              genres: tmdbMovieView.genres,
              followerAvgRating: tmdbMovieView.followerAvgRating,
            },
            tvSeries: {
              id: tmdbTvSeriesView.id,
              name: tmdbTvSeriesView.name,
              slug: tmdbTvSeriesView.slug,
              url: tmdbTvSeriesView.url,
              posterPath: tmdbTvSeriesView.posterPath,
              backdropPath: tmdbTvSeriesView.backdropPath,
              createdBy: tmdbTvSeriesView.createdBy,
              firstAirDate: tmdbTvSeriesView.firstAirDate,
              lastAirDate: tmdbTvSeriesView.lastAirDate,
              voteAverage: tmdbTvSeriesView.voteAverage,
              voteCount: tmdbTvSeriesView.voteCount,
              popularity: tmdbTvSeriesView.popularity,
              genres: tmdbTvSeriesView.genres,
              followerAvgRating: tmdbTvSeriesView.followerAvgRating,
            },
          })
          .from(groupedRecosSq)
          .leftJoin(tmdbMovieView, and(eq(groupedRecosSq.type, 'movie'), eq(groupedRecosSq.mediaId, tmdbMovieView.id)))
          .leftJoin(tmdbTvSeriesView, and(eq(groupedRecosSq.type, 'tv_series'), eq(groupedRecosSq.mediaId, tmdbTvSeriesView.id)))
          .where(cursorWhereClause)
          .orderBy(...orderBy)
          .limit(fetchLimit),

        !cursorData 
          ? tx.select({ count: sql<number>`COUNT(DISTINCT CONCAT(${reco.type}, '_', COALESCE(${reco.movieId}, ${reco.tvSeriesId})))` })
              .from(reco)
              .where(
                and(
                  eq(reco.userId, targetUserId), 
                  eq(reco.status, status),
                  type ? eq(reco.type, type) : undefined
                )
              )
          : undefined
      ]);

      const hasNextPage = results.length > per_page;
      const paginatedResults = hasNextPage ? results.slice(0, per_page) : results;

      let nextCursor: string | null = null;

      if (hasNextPage) {
        const lastItem = paginatedResults[paginatedResults.length - 1].grouped;
        let cursorValue: string | number | null = null;

        switch (sort_by) {
          case RecoSortBy.SENDER_COUNT:
            cursorValue = Number(lastItem.senderCount);
            break;
          case RecoSortBy.LAST_SEND_AT:
            cursorValue = lastItem.lastSendAt;
            break;
          case RecoSortBy.FIRST_SEND_AT:
          default:
            cursorValue = lastItem.firstSendAt;
            break;
        }

        if (cursorValue !== null) {
          nextCursor = encodeCursor<BaseCursor<string | number, number>>({
            value: cursorValue,
            id: lastItem.mediaId,
          });
        }
      }

      const mappedData: RecoWithMediaUnion[] = paginatedResults.map((row) => {
        const base = {
          mediaId: row.grouped.mediaId,
          type: row.grouped.type,
          senders: row.grouped.senders,
          latestCreatedAt: row.grouped.lastSendAt,
        };

        if (base.type === RecoType.MOVIE && row.movie) {
          return { ...base, type: RecoType.MOVIE, media: row.movie };
        } else {
          return { ...base, type: RecoType.TV_SERIES, media: row.tvSeries };
        }
      });

      return {
        data: mappedData,
        meta: {
          next_cursor: nextCursor,
          per_page,
          total_results: totalCountResult ? Number(totalCountResult[0].count) : undefined,
        },
      };
    });
  }
}
