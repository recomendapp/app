import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { LogMovieRequestDto, LogMovieDto } from './dto/log-movie.dto';
import { and, avg, desc, eq, isNotNull, sql } from 'drizzle-orm';
import { bookmark, follow, logMovie, logMovieWatchedDate, profile, reviewMovie, user } from '@libs/db/schemas';
import { User } from '../../auth/auth.service';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle/drizzle.module';
import { FollowingAverageRatingDto, FollowingLogDto, FollowingLogsQueryDto } from './dto/following-log-movie.dto';
import { RecosService } from '../../recos/recos.service';
import { RecoType } from '../../recos/dto/recos.dto';
import { plainToInstance } from 'class-transformer';
import { USER_COMPACT_SELECT } from '@libs/db/selectors';
import { WorkerClient } from '@shared/worker';

@Injectable()
export class MovieLogsService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
    private readonly recosService: RecosService,
    private readonly workerClient: WorkerClient,
  ) {}

  async get(user: User, movieId: number): Promise<LogMovieDto | null> {
    const logEntry = await this.db.query.logMovie.findFirst({
      where: and(
        eq(logMovie.userId, user.id),
        eq(logMovie.movieId, movieId),
      ),
      with: {
        review: true
      }
    })

    if (!logEntry) return null;
    return plainToInstance(LogMovieDto, {
      ...logEntry,
      review: logEntry.review ? {
        ...logEntry.review,
        userId: logEntry.userId,
        movieId: logEntry.movieId,
      } : null,
    });
  }

  async set(user: User, movieId: number, dto: LogMovieRequestDto): Promise<LogMovieDto> {    
    const isInserted = await this.db.transaction(async (tx) => {
      const [logEntry] = await tx
        .insert(logMovie)
        .values({
          userId: user.id,
          movieId: movieId,
          rating: dto.rating,
          ratedAt: dto.rating != null ? sql`now()` : null,
          isLiked: dto.isLiked || false,
          likedAt: dto.isLiked ? sql`now()` : null,
          watchCount: 1,
          firstWatchedAt: sql`now()`,
          lastWatchedAt: sql`now()`,
        })
        .onConflictDoUpdate({
          target: [logMovie.movieId, logMovie.userId],
          set: {
            rating: dto.rating !== undefined ? dto.rating : sql`${logMovie.rating}`,
            ratedAt: dto.rating !== undefined 
              ? (dto.rating === null ? null : sql`now()`) 
              : sql`${logMovie.ratedAt}`,
            isLiked: dto.isLiked !== undefined ? dto.isLiked : sql`${logMovie.isLiked}`,
            likedAt: dto.isLiked !== undefined
              ? (dto.isLiked ? sql`now()` : null)
              : sql`${logMovie.likedAt}`,
          },
        })
        .returning();

      const isInsert = logEntry.createdAt === logEntry.updatedAt;
      
      if (isInsert) {
        await tx.insert(logMovieWatchedDate).values({
          logMovieId: logEntry.id,
          watchedDate: sql`now()`,
        });
      }

      // Complete any active bookmarks for this movie
      await tx.update(bookmark)
        .set({ status: 'completed' })
        .where(
          and(
            eq(bookmark.userId, user.id),
            eq(bookmark.movieId, movieId),
            eq(bookmark.type, RecoType.MOVIE),
            eq(bookmark.status, 'active')
          )
        );
      
      // Complete any active recos for this movie
      await this.recosService.complete({
        userId: user.id,
        type: RecoType.MOVIE,
        mediaId: movieId,
        tx,
      })

      return isInsert;
    });

    const logEntry = await this.db.query.logMovie.findFirst({
      where: and(
        eq(logMovie.userId, user.id),
        eq(logMovie.movieId, movieId),
      ),
      with: {
        review: true,
      }
    });

    if (isInserted) {
      await this.workerClient.emit('feed:insert-activity', {
        userId: user.id,
        activityType: 'log_movie',
        activityId: logEntry.id,
      });
    }

    return plainToInstance(LogMovieDto, {
      ...logEntry,
      review: logEntry.review ? {
        ...logEntry.review,
        userId: logEntry.userId,
        movieId: logEntry.movieId,
      } : null,
    });
  }

  async delete(user: User, movieId: number): Promise<LogMovieDto> {
    const deletedLog = await this.db.transaction(async (tx) => {
      const logEntry = await tx.query.logMovie.findFirst({
        where: and(
          eq(logMovie.userId, user.id),
          eq(logMovie.movieId, movieId),
        ),
        with: {
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

      return logEntry;
    });

    await this.workerClient.emit('feed:delete-activity', {
      activityType: 'log_movie',
      activityId: deletedLog.id,
    });

    return plainToInstance(LogMovieDto, {
      ...deletedLog,
      review: deletedLog.review ? {
        ...deletedLog.review,
        userId: deletedLog.userId,
        movieId: deletedLog.movieId,
      } : null,
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
        user: USER_COMPACT_SELECT,
      })
      .from(logMovie)
      .innerJoin(follow, eq(follow.followingId, logMovie.userId))
      .innerJoin(user, eq(user.id, logMovie.userId))
      .innerJoin(profile, eq(profile.id, user.id))
      .leftJoin(reviewMovie, eq(reviewMovie.id, logMovie.id))      .where(whereClause)
      .groupBy(
        logMovie.id,
        user.id,
        profile.id,
        reviewMovie.id
      )
      .orderBy(desc(logMovie.createdAt));
    return plainToInstance(FollowingLogDto, rows.map(row => ({
      ...row.log,
      user: row.user,
      review: row.review ? {
        ...row.review,
        userId: row.log.userId,
        movieId: row.log.movieId,
      } : null,
    })));
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

    return plainToInstance(FollowingAverageRatingDto, {
      averageRating: averageValue !== null ? Math.round(averageValue * 10) / 10 : null,
    });
  }
}
