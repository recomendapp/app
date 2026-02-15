import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { follow, logMovie, profile, tmdbMovieView } from '@libs/db/schemas';
import { User } from '../../auth/auth.service';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle.module';
import { UserMovieDto } from './dto/user-movie.dto';
import { SupportedLocale } from '@libs/i18n';

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
  }): Promise<UserMovieDto | null> {
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
}
