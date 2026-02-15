import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { LogMovieRequestDto, LogMovieDto } from './dto/log-movie.dto';
import { and, eq, sql } from 'drizzle-orm';
import { logMovie, logMovieWatchedDate } from '@libs/db/schemas';
import { User } from '../../auth/auth.service';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle.module';

@Injectable()
export class MoviesLogService {
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
}
