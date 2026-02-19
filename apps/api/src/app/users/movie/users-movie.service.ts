import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq, exists, or, SQL, sql } from 'drizzle-orm';
import { follow, logMovie, profile, reviewMovie, tmdbMovieView } from '@libs/db/schemas';
import { User } from '../../auth/auth.service';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle.module';
import { ListUserMovieWithMovieDto, UserMovieWithUserMovieDto } from './dto/user-movie.dto';
import { SupportedLocale } from '@libs/i18n';
import { GetLogsMovieQueryDto, LogMovieSortBy } from '../../movies/log/dto/log-movie.dto';

@Injectable()
export class UsersMovieService {
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

  async list({
    userId,
    query,
    currentUser,
    locale,
  }: {
    userId: string;
    query: GetLogsMovieQueryDto;
    currentUser: User | null;
    locale: SupportedLocale;
  }): Promise<ListUserMovieWithMovieDto> {
    return await this.db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT set_config('app.current_language', ${locale}, true)`
      );
      if (currentUser) {
        await tx.execute(
          sql`SELECT set_config('app.current_user_id', ${currentUser.id}, true)`
        );
      }

      const { per_page, sort_order, sort_by, page } = query;
      const offset = (page - 1) * per_page;
      const direction = sort_order === 'asc' ? asc : desc;
      const orderBy = (() => {
        switch (sort_by) {
          case LogMovieSortBy.RANDOM:
            return sql`RANDOM()`;
          case LogMovieSortBy.RATING:
            return sort_order === 'asc' 
              ? sql`${logMovie.rating} ASC NULLS LAST`
              : sql`${logMovie.rating} DESC NULLS LAST`;
          case LogMovieSortBy.FIRST_WATCHED_AT:
            return direction(logMovie.firstWatchedAt);
          case LogMovieSortBy.UPDATED_AT:
          default:
            return direction(logMovie.updatedAt);
        }
      })();

      let privacyClause: SQL | undefined;

      if (currentUser?.id === userId) {
        privacyClause = undefined;
      } else if (!currentUser) {
        privacyClause = exists(
          tx.select({ id: profile.id })
            .from(profile)
            .where(and(eq(profile.id, userId), eq(profile.isPrivate, false)))
        );
      } else {
        privacyClause = or(
          exists(
            tx.select({ id: profile.id })
              .from(profile)
              .where(and(eq(profile.id, userId), eq(profile.isPrivate, false)))
          ),
          exists(
            tx.select({ id: follow.followerId })
              .from(follow)
              .where(
                and(
                  eq(follow.followerId, currentUser.id),
                  eq(follow.followingId, userId),
                  eq(follow.status, 'accepted')
                )
              )
          )
        );
      }

      const baseWhereConditions: SQL[] = [
        eq(logMovie.userId, userId),
      ];

      if (privacyClause) {
        baseWhereConditions.push(privacyClause);
      }

      const whereClause = and(...baseWhereConditions);

      const paginatedLogsSubquery = tx
        .select()
        .from(logMovie)
        .where(whereClause)
        .orderBy(orderBy)
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
          .orderBy(orderBy),
        tx.$count(logMovie, whereClause)
      ]);

      const totalPages = Math.ceil(totalCount / per_page);

      return {
        data: results.map(({ log, movie, isReviewed }) => ({
          ...log,
          isReviewed,
          movie,
        })),
        meta: {
          total_results: totalCount,
          total_pages: totalPages,
          current_page: page,
          per_page,
        }
      }
    });
  }
}
