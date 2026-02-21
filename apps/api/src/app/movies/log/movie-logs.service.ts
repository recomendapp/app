import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { LogMovieRequestDto, LogMovieDto } from './dto/log-movie.dto';
import { and, avg, desc, eq, isNotNull, sql } from 'drizzle-orm';
import { bookmark, follow, logMovie, logMovieWatchedDate, profile, reviewMovie, user } from '@libs/db/schemas';
import { User } from '../../auth/auth.service';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle.module';
import { FollowingAverageRatingDto, FollowingLogDto, FollowingLogsQueryDto } from './dto/following-log-movie.dto';

@Injectable()
export class MovieLogsService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  async get(user: User, movieId: number): Promise<LogMovieDto | null> {
    const logEntry = await this.db.query.logMovie.findFirst({
      where: and(
        eq(logMovie.userId, user.id),
        eq(logMovie.movieId, movieId),
      ),
      with: {
        watchedDates: {
          columns: {
            id: true,
            watchedDate: true,
          },
        },
        review: true
      }
    })

    if (!logEntry) return null;
    return {
      ...logEntry,
      review: logEntry.review ? {
        ...logEntry.review,
        userId: logEntry.userId,
        movieId: logEntry.movieId,
      } : null,
    }
  }

  async set(user: User, movieId: number, dto: LogMovieRequestDto): Promise<LogMovieDto> {
    const now = new Date();
    const watchedDate = dto.watchedAt ? new Date(dto.watchedAt) : now;
    
    await this.db.transaction(async (tx) => {
      const [logEntry] = await tx
        .insert(logMovie)
        .values({
          userId: user.id,
          movieId: movieId,
          rating: dto.rating,
          ratedAt: dto.rating != null ? now : null,
          isLiked: dto.isLiked || false,
          likedAt: dto.isLiked ? now : null,
          watchCount: 1,
          firstWatchedAt: watchedDate,
          lastWatchedAt: watchedDate,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [logMovie.movieId, logMovie.userId],
          set: {
            rating: dto.rating !== undefined ? dto.rating : sql`${logMovie.rating}`,
            ratedAt: dto.rating !== undefined ? (dto.rating === null ? null : now) : sql`${logMovie.ratedAt}`,
            isLiked: dto.isLiked !== undefined ? dto.isLiked : sql`${logMovie.isLiked}`,
            likedAt: dto.isLiked === true ? now : (dto.isLiked === false ? null : sql`${logMovie.likedAt}`),
            updatedAt: now,
          },
        })
        .returning();

      const isInsert = logEntry.createdAt.getTime() === logEntry.updatedAt.getTime();
      
      if (isInsert) {
        await tx.insert(logMovieWatchedDate).values({
          logMovieId: logEntry.id,
          watchedDate: watchedDate,
        });
      }

      // Complete any active bookmarks for this movie
      await tx.update(bookmark)
        .set({ status: 'completed' })
        .where(
          and(
            eq(bookmark.userId, user.id),
            eq(bookmark.movieId, movieId),
            eq(bookmark.type, 'movie'),
            eq(bookmark.status, 'active')
          )
        );
    });

    const logEntry = await this.db.query.logMovie.findFirst({
      where: and(
        eq(logMovie.userId, user.id),
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
      }
    });

    return {
      ...logEntry,
      review: logEntry.review ? {
        ...logEntry.review,
        userId: logEntry.userId,
        movieId: logEntry.movieId,
      } : null,
    };
  }

  async delete(user: User, movieId: number): Promise<LogMovieDto> {
    return await this.db.transaction(async (tx) => {
      const logEntry = await tx.query.logMovie.findFirst({
        where: and(
          eq(logMovie.userId, user.id),
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
        }
      });

      if (!logEntry) {
        throw new NotFoundException('Log entry not found');
      }

      await tx.delete(logMovie).where(
        and(
          eq(logMovie.userId, user.id),
          eq(logMovie.movieId, movieId),
        )
      );

      return {
        ...logEntry,
        review: logEntry.review ? {
          ...logEntry.review,
          userId: logEntry.userId,
          movieId: logEntry.movieId,
        } : null,
      };
    });
  }

  // Following
  async getFollowingLogs(
    currentUser: User,
    movieId: number,
    query: FollowingLogsQueryDto,
  ): Promise<FollowingLogDto[]> {
    const { has_rating } = query;

    const whereClause = and(
      eq(logMovie.movieId, movieId),
      eq(follow.followerId, currentUser.id),
      eq(follow.status, 'accepted'),
      has_rating ? isNotNull(logMovie.rating) : undefined
    );

    const rows = await this.db
      .select({
        log: logMovie,
        review: reviewMovie,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          avatar: user.image,
          isPremium: profile.isPremium,
        },
        watchedDates: sql<Omit<typeof logMovieWatchedDate.$inferSelect, 'logMovieId'>[]>`
          COALESCE(
            json_agg(
              json_build_object(
                'id', ${logMovieWatchedDate.id},
                'watchedDate', ${logMovieWatchedDate.watchedDate}
              )
            ) FILTER (WHERE ${logMovieWatchedDate.id} IS NOT NULL),
            '[]'::json
          )
        `,
      })
      .from(logMovie)
      .innerJoin(follow, eq(follow.followingId, logMovie.userId))
      .innerJoin(user, eq(user.id, logMovie.userId))
      .innerJoin(profile, eq(profile.id, user.id))
      .leftJoin(reviewMovie, eq(reviewMovie.id, logMovie.id))
      .leftJoin(logMovieWatchedDate, eq(logMovieWatchedDate.logMovieId, logMovie.id))
      .where(whereClause)
      .groupBy(
        logMovie.id,
        user.id,
        profile.id,
        reviewMovie.id
      )
      .orderBy(desc(logMovie.createdAt));
    return rows.map(row => ({
      ...row.log,
      user: row.user,
      watchedDates: row.watchedDates.map(d => ({
        id: d.id,
        watchedDate: new Date(d.watchedDate),
      })),
      review: row.review ? {
        ...row.review,
        userId: row.log.userId,
        movieId: row.log.movieId,
      } : null,
    }));
  }

  async getFollowingAverageRating(
    currentUser: User, 
    movieId: number
  ): Promise<FollowingAverageRatingDto> {
    const [result] = await this.db
      .select({
        average: avg(logMovie.rating), 
      })
      .from(logMovie)
      .innerJoin(follow, eq(follow.followingId, logMovie.userId))
      .where(
        and(
          eq(logMovie.movieId, movieId),
          eq(follow.followerId, currentUser.id),
          eq(follow.status, 'accepted'),
          isNotNull(logMovie.rating)
        )
      );

    const averageValue = result?.average ? Number(result.average) : null;

    return {
      averageRating: averageValue !== null ? Math.round(averageValue * 10) / 10 : null,
    };
  }
}
