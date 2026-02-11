import { Inject, Injectable } from '@nestjs/common';
import { LogMovieRequestDto, LogMovieDto } from './dto/log-movie.dto';
import { and, eq, sql } from 'drizzle-orm';
import { WatchedDateDto } from './dto/watched-date.dto';
import { logMovie, logMovieWatchedDate } from '@libs/db/schemas';
import { User } from '../../auth/auth.service';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle.module';

@Injectable()
export class MoviesLogService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  async getLog(user: User, movieId: number, targetUserId?: string): Promise<LogMovieDto | null> {
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
      }
    })

    if (!logEntry) return null;
    return new LogMovieDto(logEntry);
  }

  async setLog(user: User, movieId: number, dto: LogMovieRequestDto): Promise<LogMovieDto> {
    const now = new Date();
    const watchedDate = dto.watchedAt ? new Date(dto.watchedAt) : now;
    return await this.db.transaction(async (tx) => {
      const [logEntry] = await tx
        .insert(logMovie)
        .values({
          userId: user.id,
          movieId: movieId,
          rating: dto.rating,
          ratedAt: dto.rating ? now : null,
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
            ratedAt: dto.rating !== undefined ? now : sql`${logMovie.ratedAt}`,
            isLiked: dto.isLiked !== undefined ? dto.isLiked : sql`${logMovie.isLiked}`,
            likedAt: dto.isLiked === true ? now : (dto.isLiked === false ? null : sql`${logMovie.likedAt}`),
            updatedAt: now,
          },
        })
        .returning();

      const isInsert = logEntry.createdAt.getTime() === logEntry.updatedAt.getTime();
      
      let newWatchedDateEntry: { id: number, watchedDate: Date } | null = null;

      if (isInsert) {
        const [insertedDate] = await tx.insert(logMovieWatchedDate).values({
          logMovieId: logEntry.id,
          watchedDate: watchedDate,
        }).returning({
            id: logMovieWatchedDate.id,
            watchedDate: logMovieWatchedDate.watchedDate
        });
        
        newWatchedDateEntry = insertedDate;
      }

      const responseDates: WatchedDateDto[] = [];
      
      if (newWatchedDateEntry) {
          responseDates.push(new WatchedDateDto({
              id: Number(newWatchedDateEntry.id),
              watchedDate: newWatchedDateEntry.watchedDate
          }));
      }

      return new LogMovieDto({
        ...logEntry,
        id: Number(logEntry.id),
        movieId: Number(logEntry.movieId),
        watchedDates: responseDates, 
      });
    });
  }
}
