import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, exists, gt, lt, or, SQL, sql } from 'drizzle-orm';
import { bookmark, follow, profile, tmdbMovieView, tmdbTvSeriesView } from '@libs/db/schemas';
import { User } from '../../auth/auth.service';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle.module';
import { BaseListBookmarksQueryDto, BookmarkSortBy, ListBookmarksDto, ListBookmarksQueryDto, ListInfiniteBookmarksDto, ListInfiniteBookmarksQueryDto } from '../../bookmarks/dto/bookmarks.dto';
import { SupportedLocale } from '@libs/i18n';
import { SortOrder } from '../../../common/dto/sort.dto';
import { DbTransaction } from '@libs/db';
import { BaseCursor, decodeCursor, encodeCursor } from '../../../utils/cursor';

@Injectable()
export class UserBookmarksService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  /* ---------------------------------- List ---------------------------------- */
  private async getListBaseQuery(
    tx: DbTransaction,
    targetUserId: string,
    locale: SupportedLocale,
    currentUser: User | null,
    sortBy: BookmarkSortBy,
    sortOrder: SortOrder,
    status?: BaseListBookmarksQueryDto['status'],
    type?: BaseListBookmarksQueryDto['type'],
  ) {
    await tx.execute(sql`SELECT set_config('app.current_language', ${locale}, true)`);
    if (currentUser) {
      await tx.execute(sql`SELECT set_config('app.current_user_id', ${currentUser.id}, true)`);
    }

    const direction = sortOrder === SortOrder.ASC ? asc : desc;
    
    const orderBy = (() => {
      switch (sortBy) {
        case BookmarkSortBy.RANDOM:
          return [sql`RANDOM()`];
        case BookmarkSortBy.UPDATED_AT:
          return [direction(bookmark.updatedAt), direction(bookmark.id)];
        case BookmarkSortBy.CREATED_AT:
        default:
          return [direction(bookmark.createdAt), direction(bookmark.id)];
      }
    })();

    let privacyClause: SQL | undefined;
    if (currentUser?.id !== targetUserId) {
      const isPublicProfile = exists(
        tx.select({ id: profile.id })
          .from(profile)
          .where(and(eq(profile.id, targetUserId), eq(profile.isPrivate, false)))
      );

      if (!currentUser) {
        privacyClause = isPublicProfile;
      } else {
        privacyClause = or(
          isPublicProfile,
          exists(
            tx.select({ id: follow.followerId })
              .from(follow)
              .where(
                and(
                  eq(follow.followerId, currentUser.id),
                  eq(follow.followingId, targetUserId),
                  eq(follow.status, 'accepted')
                )
              )
          )
        );
      }
    }

    const baseWhereConditions: SQL[] = [eq(bookmark.userId, targetUserId)];

    if (status) baseWhereConditions.push(eq(bookmark.status, status));
    if (type) baseWhereConditions.push(eq(bookmark.type, type));
    if (privacyClause) baseWhereConditions.push(privacyClause);

    return { 
      whereClause: and(...baseWhereConditions), 
      orderBy 
    };
  }
  async list({
    targetUserId,
    query,
    currentUser,
    locale,
  }: {
    targetUserId: string;
    query: ListBookmarksQueryDto;
    currentUser: User | null;
    locale: SupportedLocale;
  }): Promise<ListBookmarksDto> {
    return await this.db.transaction(async (tx) => {
      const { per_page, page, sort_by, sort_order, status, type } = query;
      const offset = (page - 1) * per_page;

      const { whereClause, orderBy } = await this.getListBaseQuery(
        tx,
        targetUserId,
        locale,
        currentUser,
        sort_by,
        sort_order,
        status,
        type
      );

      const paginatedBookmarksSubquery = tx.select()
        .from(bookmark)
        .where(whereClause)
        .orderBy(...orderBy)
        .limit(per_page)
        .offset(offset)
        .as('paginated_bookmarks');

      const [results, totalCount] = await Promise.all([
        tx.select({
            bookmark: bookmark,
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
          .from(paginatedBookmarksSubquery)
          .innerJoin(bookmark, eq(bookmark.id, paginatedBookmarksSubquery.id))
          .leftJoin(tmdbMovieView, eq(bookmark.movieId, tmdbMovieView.id))
          .leftJoin(tmdbTvSeriesView, eq(bookmark.tvSeriesId, tmdbTvSeriesView.id))
          .orderBy(...orderBy),
        tx.$count(bookmark, whereClause)
      ]);

      return {
        data: results.map(({ bookmark: {
          movieId,
          tvSeriesId,
          ...bookmark
        }, movie, tvSeries }) => ({
          ...bookmark,
          mediaId: bookmark.type === 'movie' ? movieId : tvSeriesId,
          media: bookmark.type === 'movie' ? movie : tvSeries,
        })),
        meta: {
          total_results: totalCount,
          total_pages: Math.ceil(totalCount / per_page),
          current_page: page,
          per_page,
        },
      };
    });
  }
  async listInfinite({
    targetUserId,
    query,
    currentUser,
    locale,
  }: {
    targetUserId: string;
    query: ListInfiniteBookmarksQueryDto;
    currentUser: User | null;
    locale: SupportedLocale;
  }): Promise<ListInfiniteBookmarksDto> {
    return await this.db.transaction(async (tx) => {
      const { per_page, sort_order, sort_by, cursor, status, type } = query;

      const cursorData = cursor ? decodeCursor<BaseCursor<string | number, number>>(cursor) : null;

      const { whereClause: baseWhereClause, orderBy } = await this.getListBaseQuery(
        tx,
        targetUserId,
        locale,
        currentUser,
        sort_by,
        sort_order,
        status,
        type
      );

      let cursorWhereClause: SQL | undefined;

      if (cursorData) {
        const operator = sort_order === SortOrder.ASC ? gt : lt;

        switch (sort_by) {
          case BookmarkSortBy.UPDATED_AT: {
            const updatedDate = new Date(cursorData.value as string);
            cursorWhereClause = or(
              operator(bookmark.updatedAt, updatedDate),
              and(
                eq(bookmark.updatedAt, updatedDate),
                operator(bookmark.id, cursorData.id)
              )
            );
            break;
          }

          case BookmarkSortBy.RANDOM:
            break;

          case BookmarkSortBy.CREATED_AT:
          default: {
            const createdDate = new Date(cursorData.value as string);
            cursorWhereClause = or(
              operator(bookmark.createdAt, createdDate),
              and(
                eq(bookmark.createdAt, createdDate),
                operator(bookmark.id, cursorData.id)
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

      const paginatedBookmarksSubquery = tx.select()
        .from(bookmark)
        .where(finalWhereClause)
        .orderBy(...orderBy)
        .limit(fetchLimit)
        .as('paginated_bookmarks');

      const results = await tx.select({
          bookmark: bookmark,
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
        .from(paginatedBookmarksSubquery)
        .innerJoin(bookmark, eq(bookmark.id, paginatedBookmarksSubquery.id))
        .leftJoin(tmdbMovieView, eq(bookmark.movieId, tmdbMovieView.id))
        .leftJoin(tmdbTvSeriesView, eq(bookmark.tvSeriesId, tmdbTvSeriesView.id))
        .orderBy(...orderBy);

      const hasNextPage = results.length > per_page;
      const paginatedResults = hasNextPage ? results.slice(0, per_page) : results;

      let nextCursor: string | null = null;

      if (hasNextPage) {
        const lastItem = paginatedResults[paginatedResults.length - 1].bookmark;
        let cursorValue: string | number | null = null;

        switch (sort_by) {
          case BookmarkSortBy.UPDATED_AT:
            cursorValue = lastItem.updatedAt.toISOString();
            break;
          case BookmarkSortBy.CREATED_AT:
          default:
            cursorValue = lastItem.createdAt.toISOString();
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
        data: paginatedResults.map(({ bookmark: {
          movieId,
          tvSeriesId,
          ...bookmark
        }, movie, tvSeries }) => ({
          ...bookmark,
          mediaId: bookmark.type === 'movie' ? movieId : tvSeriesId,
          media: bookmark.type === 'movie' ? movie : tvSeries,
        })),
        meta: {
          next_cursor: nextCursor,
          per_page,
        }
      };
    });
  }
}
