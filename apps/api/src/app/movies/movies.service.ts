import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MovieDto } from './dto/movies.dto';
import { DRIZZLE_SERVICE, DrizzleService } from '../../common/modules/drizzle.module';
import { follow, logMovie, playlist, playlistItem, playlistMember, profile, reviewMovie, tmdbMovieCredit, tmdbMovieRole, tmdbMovieView, tmdbPersonView, user } from '@libs/db/schemas';
import { and, asc, desc, eq, exists, or, SQL, sql } from 'drizzle-orm';
import { User } from '../auth/auth.service';
import { SupportedLocale } from '@libs/i18n';
import { GetReviewsMovieQueryDto, ListReviewMovieDto } from '../reviews/movie/dto/reviews-movie.dto';
import { GetPlaylistsQueryDto, ListPlaylistsWithOwnerDto } from '../playlists/dto/playlists.dto';
import { MovieCastingDto } from './dto/movie-credits.dto';

@Injectable()
export class MoviesService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  async get({
    movieId,
    currentUser,
    locale,
  }: {
    movieId: number;
    currentUser: User | null;
    locale: SupportedLocale;
  }): Promise<MovieDto> {
    return await this.db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT set_config('app.current_language', ${locale}, true)`
      );
      if (currentUser) {
        await tx.execute(
          sql`SELECT set_config('app.current_user_id', ${currentUser.id}, true)`
        );
      }

      const [movie] = await tx
        .select()
        .from(tmdbMovieView)
        .where(eq(tmdbMovieView.id, movieId))
        .limit(1);

      if (!movie) {
        throw new NotFoundException(`Movie with id ${movieId} not found`);
      }

      return movie;
    });
  }

  async getCasting({
    movieId,
    locale,
  }: {
    movieId: number;
    locale: SupportedLocale;
  }): Promise<MovieCastingDto[]> {
    return await this.db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT set_config('app.current_language', ${locale}, true)`
      );

      const aggregatedCastingSq = tx
        .select({
          movieId: tmdbMovieCredit.movieId,
          personId: tmdbMovieCredit.personId,
          order: sql<number>`MIN(${tmdbMovieRole.order})`.as('min_order'),
          roles: sql<Pick<typeof tmdbMovieRole.$inferSelect, 'character' | 'order'>[]>`
            jsonb_agg(
              jsonb_build_object(
                'character', ${tmdbMovieRole.character},
                'order', ${tmdbMovieRole.order}
              ) ORDER BY ${tmdbMovieRole.order} ASC
            )
          `.as('roles_agg'),
        })
        .from(tmdbMovieCredit)
        .leftJoin(tmdbMovieRole, eq(tmdbMovieRole.creditId, tmdbMovieCredit.id))
        .where(
          and(
            eq(tmdbMovieCredit.movieId, movieId),
            eq(tmdbMovieCredit.job, 'Actor')
          )
        )
        .groupBy(tmdbMovieCredit.movieId, tmdbMovieCredit.personId)
        .as('aggregated_casting');

      const castingData = await tx
        .select({
          movieId: aggregatedCastingSq.movieId,
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

  async getReviews({
    movieId,
    query,
    currentUser,
  }: {
    movieId: number;
    query: GetReviewsMovieQueryDto,
    currentUser: User | null;
  }): Promise<ListReviewMovieDto> {
    const { per_page, page, sort_by, sort_order } = query;
    const offset = (page - 1) * per_page;

    let isVisibleLogic: SQL;

    if (!currentUser) {
      isVisibleLogic = eq(profile.isPrivate, false);
    } else {
      const isFollowingSubquery = this.db
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

    const direction = sort_order === 'asc' ? asc : desc;
    const orderBy = (() => {
      switch (sort_by) {
        case 'likes_count':
          return direction(reviewMovie.likesCount);
        case 'updated_at':
          return direction(reviewMovie.updatedAt);
        case 'rating':
          return direction(logMovie.rating); 
        case 'created_at':
        default:
          return direction(reviewMovie.createdAt);
      }
    })();

    const [reviewsData, totalCountResult] = await Promise.all([
      this.db
        .select({
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
        .orderBy(orderBy)
        .limit(per_page)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(reviewMovie)
        .innerJoin(logMovie, eq(logMovie.id, reviewMovie.id))
        .innerJoin(profile, eq(profile.id, logMovie.userId))
        .where(whereClause)
    ]);

    const totalCount = Number(totalCountResult[0]?.count || 0);
    const totalPages = Math.ceil(totalCount / per_page);

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
        total_pages: totalPages,
        current_page: page,
        per_page,
      },
    };
  }

  async getPlaylists({
    movieId,
    query,
    currentUser,
  }: {
    movieId: number;
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
      eq(playlistItem.movieId, movieId),
      eq(playlistItem.type, 'movie'),
      isVisibleLogic
    );

    const direction = sort_order === 'asc' ? asc : desc;
    const orderBy = (() => {
      switch (sort_by) {
        case 'likes_count':
          return direction(playlist.likesCount);
        case 'updated_at':
          return direction(playlist.updatedAt);
        case 'created_at':
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
