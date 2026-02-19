import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DRIZZLE_SERVICE, DrizzleService } from '../../common/modules/drizzle.module';
import { follow, playlist, playlistItem, playlistMember, profile, tmdbPersonView, tmdbTvSeasonView, tmdbTvSeriesCredit, tmdbTvSeriesRole, tmdbTvSeriesView, user } from '@libs/db/schemas';
import { and, asc, desc, eq, exists, or, SQL, sql } from 'drizzle-orm';
import { User } from '../auth/auth.service';
import { SupportedLocale } from '@libs/i18n';
import { TvSeriesDto } from './dto/tv-series.dto';
import { TvSeriesCastingDto } from './dto/tv-series-credits.dto';
import { TvSeasonCompactDto } from './seasons/dto/tv-seasons.dto';
import { GetPlaylistsQueryDto, ListPlaylistsWithOwnerDto, PlaylistSortBy } from '../playlists/dto/playlists.dto';

@Injectable()
export class TvSeriesService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  async get({
    tvSeriesId,
    currentUser,
    locale,
  }: {
    tvSeriesId: number;
    currentUser: User | null;
    locale: SupportedLocale;
  }): Promise<TvSeriesDto> {
    return await this.db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT set_config('app.current_language', ${locale}, true)`
      );
      if (currentUser) {
        await tx.execute(
          sql`SELECT set_config('app.current_user_id', ${currentUser.id}, true)`
        );
      }

      const [tvSeries] = await tx
        .select()
        .from(tmdbTvSeriesView)
        .where(eq(tmdbTvSeriesView.id, tvSeriesId))
        .limit(1);

      if (!tvSeries) {
        throw new NotFoundException(`TV Series with id ${tvSeriesId} not found`);
      }

      return tvSeries;
    });
  }

  async getSeasons({
    tvSeriesId,
    locale,
  }: {
    tvSeriesId: number;
    locale: SupportedLocale;
  }): Promise<TvSeasonCompactDto[]> {
    return await this.db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT set_config('app.current_language', ${locale}, true)`
      );

      const seasons = await tx
        .select({
          id: tmdbTvSeasonView.id,
          tvSeriesId: tmdbTvSeasonView.tvSeriesId,
          seasonNumber: tmdbTvSeasonView.seasonNumber,
          posterPath: tmdbTvSeasonView.posterPath,
          episodeCount: tmdbTvSeasonView.episodeCount,
          voteAverage: tmdbTvSeasonView.voteAverage,
          voteCount: tmdbTvSeasonView.voteCount,
          url: tmdbTvSeasonView.url,
        })
        .from(tmdbTvSeasonView)
        .where(eq(tmdbTvSeasonView.tvSeriesId, tvSeriesId))
        .orderBy(asc(tmdbTvSeasonView.seasonNumber));
      
      return seasons;
    });
  }
    
  async getCasting({
    tvSeriesId,
    locale,
  }: {
    tvSeriesId: number;
    locale: SupportedLocale;
  }): Promise<TvSeriesCastingDto[]> {
    return await this.db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT set_config('app.current_language', ${locale}, true)`
      );

      const aggregatedCastingSq = tx
        .select({
          tvSeriesId: tmdbTvSeriesCredit.tvSeriesId, 
          personId: tmdbTvSeriesCredit.personId,
          order: sql<number>`MIN(${tmdbTvSeriesRole.order})`.as('min_order'),
          roles: sql<Pick<typeof tmdbTvSeriesRole.$inferSelect, 'character' | 'order'>[]>`
            jsonb_agg(
              jsonb_build_object(
                'character', ${tmdbTvSeriesRole.character},
                'order', ${tmdbTvSeriesRole.order}
              ) ORDER BY ${tmdbTvSeriesRole.order} ASC
            )
          `.as('roles_agg'),
        })
        .from(tmdbTvSeriesCredit)
        .leftJoin(tmdbTvSeriesRole, eq(tmdbTvSeriesRole.creditId, tmdbTvSeriesCredit.id))
        .where(
          and(
            eq(tmdbTvSeriesCredit.tvSeriesId, tvSeriesId),
            eq(tmdbTvSeriesCredit.job, 'Actor')
          )
        )
        .groupBy(tmdbTvSeriesCredit.tvSeriesId, tmdbTvSeriesCredit.personId)
        .as('aggregated_casting');

      const castingData = await tx
        .select({
          tvSeriesId: aggregatedCastingSq.tvSeriesId,
          personId: aggregatedCastingSq.personId,
          order: aggregatedCastingSq.order,
          roles: aggregatedCastingSq.roles,
          person: {
            id: tmdbPersonView.id,
            name: tmdbPersonView.name,
            profilePath: tmdbPersonView.profilePath,
            slug: tmdbPersonView.slug,
            url: tmdbPersonView.url,
          },
        })
        .from(aggregatedCastingSq)
        .innerJoin(tmdbPersonView, eq(tmdbPersonView.id, aggregatedCastingSq.personId))
        .orderBy(asc(aggregatedCastingSq.order));
      
      return castingData;
    });
  }

  async getPlaylists({
    tvSeriesId,
    query,
    currentUser,
  }: {
    tvSeriesId: number;
    query: GetPlaylistsQueryDto,
    currentUser: User | null;
  }): Promise<ListPlaylistsWithOwnerDto> {
    const { per_page, page, sort_by, sort_order } = query;
    const offset = (page - 1) * per_page;

    let isVisibleLogic: SQL;

    if (!currentUser) {
      isVisibleLogic = eq(playlist.visibility, 'public');
    } else {
      const isFollowingSubquery = this.db
        .select({ is_following: sql<boolean>`true` })
        .from(follow)
        .where(
          and(
            eq(follow.followerId, currentUser.id),
            eq(follow.followingId, playlist.userId),
            eq(follow.status, 'accepted')
          )
        )
        .limit(1);

      const isMemberSubquery = this.db
        .select({ is_member: sql<boolean>`true` })
        .from(playlistMember)
        .where(
          and(
            eq(playlistMember.playlistId, playlist.id),
            eq(playlistMember.userId, currentUser.id)
          )
        )
        .limit(1);

      isVisibleLogic = or(
        eq(playlist.userId, currentUser.id),
        eq(playlist.visibility, 'public'),
        and(
          eq(playlist.visibility, 'followers'),
          exists(isFollowingSubquery)
        ),
        exists(isMemberSubquery)
      );
    }

    const whereClause = and(
      eq(playlistItem.tvSeriesId, tvSeriesId),
      eq(playlistItem.type, 'tv_series'),
      isVisibleLogic
    );

    const direction = sort_order === 'asc' ? asc : desc;
    const orderBy = (() => {
      switch (sort_by) {
        case PlaylistSortBy.RANDOM:
          return sql`RANDOM()`;
        case PlaylistSortBy.LIKES_COUNT:
          return direction(playlist.likesCount);
        case PlaylistSortBy.UPDATED_AT:
          return direction(playlist.updatedAt);
        case PlaylistSortBy.CREATED_AT:
        default:
          return direction(playlist.createdAt);
      }
    })();

    const rows = await this.db
      .select({
        playlist: playlist,
        totalCount: sql<number>`count(*) OVER()`.mapWith(Number),
        owner: {
          id: user.id,
          name: user.name,
          username: user.username,
          avatar: user.image,
          isPremium: profile.isPremium,
        }
      })
      .from(playlist)
      .innerJoin(playlistItem, eq(playlistItem.playlistId, playlist.id))
      .innerJoin(user, eq(user.id, playlist.userId))
      .innerJoin(profile, eq(profile.id, user.id))
      .where(whereClause)
      .orderBy(orderBy)
      .limit(per_page)
      .offset(offset);
    
    const totalCount = rows.length > 0 ? rows[0].totalCount : 0;
    const totalPages = Math.ceil(totalCount / per_page);

    return {
      data: rows.map((row) => ({
        ...row.playlist,
        owner: row.owner,
      })),
      meta: {
        total_results: totalCount,
        total_pages: totalPages,
        current_page: page,
        per_page,
      },
    };
  }
}
