import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, inArray, or, sql, SQL } from 'drizzle-orm';
import { 
  feed, follow, logMovie, logTvSeries, playlist, playlistLike, 
  profile, reviewMovie, reviewMovieLike, reviewTvSeries, 
  reviewTvSeriesLike, tmdbMovieView, tmdbTvSeriesView, user 
} from '@libs/db/schemas';
import { plainToInstance } from 'class-transformer';
import { MOVIE_COMPACT_SELECT, TV_SERIES_COMPACT_SELECT, USER_COMPACT_SELECT } from '@libs/db/selectors';
import { 
  FeedLogMovieContentDto,
  FeedLogTvSeriesContentDto,
  FeedReviewMovieLikeContentDto,
  FeedReviewTvSeriesLikeContentDto,
  FeedItemUnion,
  ListInfiniteFeedDto, ListInfiniteFeedQueryDto, 
  ListPaginatedFeedDto, ListPaginatedFeedQueryDto 
} from './feed.dto';
import { DbTransaction } from '@libs/db';
import { DRIZZLE_SERVICE, DrizzleService } from '../../common/modules/drizzle/drizzle.module';
import { User } from '../auth/auth.service';
import { BaseCursor, decodeCursor, encodeCursor } from '../../utils/cursor';
import { caseWhen } from '../../utils/sql-case';
import { PlaylistDto } from '../playlists/dto/playlists.dto';
import { buildJsonbObject } from '../../utils/sql';
import { SupportedLocale } from '@libs/i18n';
import { PlaylistQueryBuilder } from '../playlists/playlists.query-builder';

@Injectable()
export class FeedService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  private buildFeedContentSql({
    currentUser,
  } : {
    currentUser: User | null;
  }): SQL<FeedItemUnion['content'] | null> {
    const activityTypeText = sql<string>`${feed.activityType}::text`;

    const movieFeedJsonb = buildJsonbObject({ ...MOVIE_COMPACT_SELECT, overview: tmdbMovieView.overview });
    const tvSeriesFeedJsonb = buildJsonbObject({ ...TV_SERIES_COMPACT_SELECT, overview: tmdbTvSeriesView.overview });
    const userCompactJsonb = buildJsonbObject(USER_COMPACT_SELECT);

    return caseWhen(
      eq(activityTypeText, 'log_movie'),
      sql<FeedLogMovieContentDto>`(
        SELECT ${buildJsonbObject(logMovie)} || jsonb_build_object(
          'movie', ${movieFeedJsonb},
          'review', CASE WHEN ${reviewMovie.id} IS NOT NULL THEN ${buildJsonbObject(reviewMovie)} ELSE NULL END
        )
        FROM ${logMovie}
        LEFT JOIN ${tmdbMovieView} ON ${tmdbMovieView.id} = ${logMovie.movieId}
        LEFT JOIN ${reviewMovie} ON ${reviewMovie.id} = ${logMovie.id}
        WHERE ${logMovie.id} = ${feed.activityId}
      )`
    )
    .when(
      eq(activityTypeText, 'log_tv_series'),
      sql<FeedLogTvSeriesContentDto>`(
        SELECT ${buildJsonbObject(logTvSeries)} || jsonb_build_object(
          'tvSeries', ${tvSeriesFeedJsonb},
          'review', CASE WHEN ${reviewTvSeries.id} IS NOT NULL THEN ${buildJsonbObject(reviewTvSeries)} ELSE NULL END
        )
        FROM ${logTvSeries}
        LEFT JOIN ${tmdbTvSeriesView} ON ${tmdbTvSeriesView.id} = ${logTvSeries.tvSeriesId}
        LEFT JOIN ${reviewTvSeries} ON ${reviewTvSeries.id} = ${logTvSeries.id}
        WHERE ${logTvSeries.id} = ${feed.activityId}
      )`
    )
    .when(
      eq(activityTypeText, 'playlist_like'),
      sql<PlaylistDto>`(
        SELECT ${buildJsonbObject({ ...playlist, role: PlaylistQueryBuilder.getRoleSelection(currentUser) })}
        FROM ${playlistLike}
        JOIN ${playlist} ON ${playlist.id} = ${playlistLike.playlistId}
        WHERE ${playlistLike.id} = ${feed.activityId}
      )`
    )
    .when(
      eq(activityTypeText, 'review_movie_like'),
      sql<FeedReviewMovieLikeContentDto>`(
        SELECT ${buildJsonbObject(reviewMovie)} || jsonb_build_object(
          'movie', ${movieFeedJsonb},
          'author', ${userCompactJsonb}
        )
        FROM ${reviewMovieLike}
        JOIN ${reviewMovie} ON ${reviewMovie.id} = ${reviewMovieLike.reviewId}
        JOIN ${logMovie} ON ${logMovie.id} = ${reviewMovie.id}
        LEFT JOIN ${tmdbMovieView} ON ${tmdbMovieView.id} = ${logMovie.movieId}
        JOIN ${user} ON ${user.id} = ${logMovie.userId}
        JOIN ${profile} ON ${profile.id} = ${user.id}
        WHERE ${reviewMovieLike.id} = ${feed.activityId}
      )`
    )
    .when(
      eq(activityTypeText, 'review_tv_series_like'),
      sql<FeedReviewTvSeriesLikeContentDto>`(
        SELECT ${buildJsonbObject(reviewTvSeries)} || jsonb_build_object(
          'tvSeries', ${tvSeriesFeedJsonb},
          'author', ${userCompactJsonb}
        )
        FROM ${reviewTvSeriesLike}
        JOIN ${reviewTvSeries} ON ${reviewTvSeries.id} = ${reviewTvSeriesLike.reviewId}
        JOIN ${logTvSeries} ON ${logTvSeries.id} = ${reviewTvSeries.id}
        LEFT JOIN ${tmdbTvSeriesView} ON ${tmdbTvSeriesView.id} = ${logTvSeries.tvSeriesId}
        JOIN ${user} ON ${user.id} = ${logTvSeries.userId}
        JOIN ${profile} ON ${profile.id} = ${user.id}
        WHERE ${reviewTvSeriesLike.id} = ${feed.activityId}
      )`
    )
    .elseNull();
  }

  private async getFeedBaseWhere(tx: DbTransaction, currentUser: User, query: ListPaginatedFeedQueryDto | ListInfiniteFeedQueryDto): Promise<SQL> {
    const conditions: SQL[] = [];

    if (query.activity_type) {
      conditions.push(eq(feed.activityType, query.activity_type));
    }

    if (query.targetUserId) {
      if (query.targetUserId !== currentUser.id) {
        const [targetProfile] = await tx.select({ isPrivate: profile.isPrivate }).from(profile).where(eq(profile.id, query.targetUserId)).limit(1);
        if (!targetProfile) throw new NotFoundException('User not found');

        if (targetProfile.isPrivate) {
          const [following] = await tx.select({ id: follow.followerId }).from(follow)
            .where(and(eq(follow.followerId, currentUser.id), eq(follow.followingId, query.targetUserId), eq(follow.status, 'accepted'))).limit(1);
          if (!following) throw new NotFoundException('Profile is private');
        }
      }
      conditions.push(eq(feed.userId, query.targetUserId));
    } else {
      const followingIdsSubquery = tx.select({ followingId: follow.followingId })
        .from(follow)
        .where(and(eq(follow.followerId, currentUser.id), eq(follow.status, 'accepted')));

      conditions.push(or(
        eq(feed.userId, currentUser.id),
        inArray(feed.userId, followingIdsSubquery)
      ));
    }

    return and(...conditions);
  }

  async listPaginated({ query, currentUser, locale }: { query: ListPaginatedFeedQueryDto; currentUser: User; locale: SupportedLocale }): Promise<ListPaginatedFeedDto> {
    return await this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_language', ${locale}, true)`);
      if (currentUser?.id) {
        await tx.execute(sql`SELECT set_config('app.current_user_id', ${currentUser.id}, true)`);
      }

      const { per_page, page } = query;
      const offset = (page - 1) * per_page;

      const baseWhere = await this.getFeedBaseWhere(tx, currentUser, query);

      const [feedRows, [{ count: totalCount }]] = await Promise.all([
        tx.select({ 
            feed: feed, 
            user: USER_COMPACT_SELECT,
            content: this.buildFeedContentSql({ currentUser })
          })
          .from(feed)
          .innerJoin(user, eq(user.id, feed.userId))
          .innerJoin(profile, eq(profile.id, user.id))
          .where(baseWhere)
          .orderBy(desc(feed.createdAt), desc(feed.id))
          .limit(per_page)
          .offset(offset),
        tx.select({ count: sql<number>`cast(count(*) as int)` }).from(feed).where(baseWhere)
      ]);

      return plainToInstance(ListPaginatedFeedDto, {
        data: feedRows.map(row => ({
          id: row.feed.id,
          createdAt: row.feed.createdAt,
          author: row.user,
          activityType: row.feed.activityType,
          activityId: row.feed.activityId,
          content: row.content,
        })),
        meta: { total_results: totalCount, total_pages: Math.ceil(totalCount / per_page), current_page: page, per_page },
      }, { excludeExtraneousValues: true });
    });
  }

  async listInfinite({ query, currentUser, locale }: { query: ListInfiniteFeedQueryDto; currentUser: User; locale: SupportedLocale }): Promise<ListInfiniteFeedDto> {
    return await this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_language', ${locale}, true)`);
      if (currentUser?.id) {
        await tx.execute(sql`SELECT set_config('app.current_user_id', ${currentUser.id}, true)`);
      }

      const { per_page, cursor } = query;
      const cursorData = cursor ? decodeCursor<BaseCursor<string, number>>(cursor) : null;
      
      const baseWhere = await this.getFeedBaseWhere(tx, currentUser, query);

      let finalWhere = baseWhere;
      if (cursorData) {
        finalWhere = and(baseWhere, sql`(${feed.createdAt}, ${feed.id}) < (${String(cursorData.value)}, ${Number(cursorData.id)})`);
      }

      const feedRows = await tx.select({ 
          feed: feed, 
          user: USER_COMPACT_SELECT,
          content: this.buildFeedContentSql({ currentUser })
        })
        .from(feed)
        .innerJoin(user, eq(user.id, feed.userId))
        .innerJoin(profile, eq(profile.id, user.id))
        .where(finalWhere)
        .orderBy(desc(feed.createdAt), desc(feed.id))
        .limit(per_page + 1);

      const hasNextPage = feedRows.length > per_page;
      const paginatedRows = hasNextPage ? feedRows.slice(0, per_page) : feedRows;

      let nextCursor: string | null = null;
      if (hasNextPage) {
        const lastItem = paginatedRows[paginatedRows.length - 1].feed;
        nextCursor = encodeCursor<BaseCursor<string, number>>({ value: lastItem.createdAt, id: lastItem.id });
      }

      return plainToInstance(ListInfiniteFeedDto, {
        data: paginatedRows.map(row => ({
          id: row.feed.id,
          createdAt: row.feed.createdAt,
          author: row.user,
          activityType: row.feed.activityType,
          activityId: row.feed.activityId,
          content: row.content,
        })),
        meta: { next_cursor: nextCursor, per_page },
      }, { excludeExtraneousValues: true });
    });
  }
}