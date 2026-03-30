import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, avg, desc, eq, isNotNull, sql } from 'drizzle-orm';
import { follow, logTvSeries, profile, reviewTvSeries, tmdbTvSeries, user } from '@libs/db/schemas';
import { plainToInstance } from 'class-transformer';
import { WorkerClient } from '@shared/worker';
import { LogTvSeriesDto, LogTvSeriesRequestDto, LogTvStatus } from './tv-series-logs.dto';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle/drizzle.module';
import { TvLogsSyncService } from './sync/tv-logs-sync.service';
import { User } from '../../auth/auth.service';
import { TvSeriesFollowingAverageRatingDto, TvSeriesFollowingLogDto, TvSeriesFollowingLogsQueryDto } from './tv-series-following-logs.dto';
import { USER_COMPACT_SELECT } from '@libs/db/selectors';

@Injectable()
export class TvSeriesLogsService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
    private readonly workerClient: WorkerClient,
    private readonly syncService: TvLogsSyncService,
  ) {}

  async get({
    currentUser,
    tvSeriesId,
  }: {
    currentUser: User;
    tvSeriesId: number;
  }): Promise<LogTvSeriesDto | null> {
    const logEntry = await this.db.query.logTvSeries.findFirst({
      where: and(eq(logTvSeries.userId, currentUser.id), eq(logTvSeries.tvSeriesId, tvSeriesId)),
      with: { 
        review: true,
        tvSeries: {
          columns: {
            id: true,
            numberOfEpisodes: true,
          }
        }
      } 
    });

    if (!logEntry) return null;

    return plainToInstance(LogTvSeriesDto, {
      ...logEntry,
      status: (
        logEntry.status !== 'dropped'
        && logEntry.tvSeries.numberOfEpisodes > 0
        && logEntry.episodesWatchedCount >= logEntry.tvSeries.numberOfEpisodes
      ) ? LogTvStatus.COMPLETED : logEntry.status as LogTvStatus,
      review: logEntry.review ? {
        ...logEntry.review,
        userId: logEntry.userId,
        tvSeriesId: logEntry.tvSeriesId,
      } : null,
    }, { excludeExtraneousValues: true })
  }

  async set({
    currentUser,
    tvSeriesId,
    dto,
  }: {
    currentUser: User;
    tvSeriesId: number;
    dto: LogTvSeriesRequestDto;
  }): Promise<LogTvSeriesDto> {    
    let isInserted = false;
    let finalLogId: number;

    await this.db.transaction(async (tx) => {
      const [tmdbSeries] = await tx.select({ id: tmdbTvSeries.id }).from(tmdbTvSeries).where(eq(tmdbTvSeries.id, tvSeriesId));
      if (!tmdbSeries) throw new NotFoundException('TMDB Series not found');
      const [seriesLog] = await tx.insert(logTvSeries).values({
        userId: currentUser.id,
        tvSeriesId: tvSeriesId,
        rating: dto.rating,
        ratedAt: dto.rating != null ? sql`now()` : null,
        isLiked: dto.isLiked || false,
        likedAt: dto.isLiked ? sql`now()` : null,
        status: dto.status === 'completed' ? 'watching' : (dto.status || 'watching'),
      })
      .onConflictDoUpdate({
        target: [logTvSeries.tvSeriesId, logTvSeries.userId],
        set: {
          rating: dto.rating !== undefined ? dto.rating : sql`${logTvSeries.rating}`,
          ratedAt: dto.rating !== undefined ? (dto.rating != null ? sql`now()` : null) : sql`${logTvSeries.ratedAt}`,
          isLiked: dto.isLiked !== undefined ? dto.isLiked : sql`${logTvSeries.isLiked}`,
          likedAt: dto.isLiked !== undefined ? (dto.isLiked ? sql`now()` : null) : sql`${logTvSeries.likedAt}`,
          status: dto.status === 'completed' ? 'watching' : (dto.status || sql`${logTvSeries.status}`),
        }
      }).returning();

      isInserted = seriesLog.createdAt === seriesLog.updatedAt;
      finalLogId = seriesLog.id;

      if (dto.status === 'completed') {
        await tx.execute(sql`
          INSERT INTO log_tv_season (
            log_tv_series_id, tv_season_id, season_number, status, created_at, updated_at
          )
          SELECT ${seriesLog.id}, id, season_number, 'watching', now(), now()
          FROM tmdb.tv_season
          WHERE tv_series_id = ${tvSeriesId} AND season_number > 0
          ON CONFLICT DO NOTHING
        `);

        await tx.execute(sql`
          INSERT INTO log_tv_episode (
            log_tv_series_id, log_tv_season_id, tv_episode_id, season_number, episode_number, watched_at, created_at, updated_at
          )
          SELECT ${seriesLog.id}, s.id, e.id, s.season_number, e.episode_number, now(), now(), now()
          FROM tmdb.tv_episode e
          JOIN log_tv_season s ON s.tv_season_id = e.tv_season_id AND s.log_tv_series_id = ${seriesLog.id}
          WHERE e.tv_season_id IN (SELECT id FROM tmdb.tv_season WHERE tv_series_id = ${tvSeriesId} AND season_number > 0)
          ON CONFLICT DO NOTHING
        `);
      }

      const { series } = await this.syncService.syncTree(tx, currentUser.id, tvSeriesId);

      return series;
    });

    if (isInserted) {
      await this.workerClient.emit('feed:insert-activity', {
        userId: currentUser.id,
        activityType: 'log_tv_series',
        activityId: finalLogId,
      });
    }

    const completeLog = await this.db.query.logTvSeries.findFirst({
      where: eq(logTvSeries.id, finalLogId),
      with: { review: true, tvSeries: { columns: { id: true, numberOfEpisodes: true } } }
    });

    return plainToInstance(LogTvSeriesDto, {
      ...completeLog,
      status: (
        completeLog.status !== 'dropped'
        && completeLog.tvSeries.numberOfEpisodes > 0
        && completeLog.episodesWatchedCount >= completeLog.tvSeries.numberOfEpisodes
      ) ? LogTvStatus.COMPLETED : completeLog.status as LogTvStatus,
      review: completeLog.review ? {
        ...completeLog.review,
        userId: completeLog.userId,
        tvSeriesId: completeLog.tvSeriesId,
      } : null,
    }, { excludeExtraneousValues: true });
  }

  async delete({
    currentUser,
    tvSeriesId,
  }: {
    currentUser: User;
    tvSeriesId: number;
  }): Promise<LogTvSeriesDto> {
    const deletedLog = await this.db.transaction(async (tx) => {
      const logEntry = await tx.query.logTvSeries.findFirst({
        where: and(
          eq(logTvSeries.userId, currentUser.id),
          eq(logTvSeries.tvSeriesId, tvSeriesId),
        ),
        with: {
          review: true,
          tvSeries: {
            columns: {
              id: true,
              numberOfEpisodes: true,
            }
          }
        }
      });

      if (!logEntry) {
        throw new NotFoundException('Series log not found');
      }

      await tx.delete(logTvSeries).where(
        and(
          eq(logTvSeries.userId, currentUser.id),
          eq(logTvSeries.tvSeriesId, tvSeriesId),
        )
      );

      return logEntry;
    });

    await this.workerClient.emit('feed:delete-activity', {
      activityType: 'log_tv_series',
      activityId: deletedLog.id,
    });

    return plainToInstance(LogTvSeriesDto, {
      ...deletedLog,
      status: (
        deletedLog.status !== 'dropped'
        && deletedLog.tvSeries.numberOfEpisodes > 0
        && deletedLog.episodesWatchedCount >= deletedLog.tvSeries.numberOfEpisodes
      ) ? LogTvStatus.COMPLETED : deletedLog.status as LogTvStatus,
      review: deletedLog.review ? {
        ...deletedLog.review,
        userId: deletedLog.userId,
        tvSeriesId: deletedLog.tvSeriesId,
      } : null,
    }, { excludeExtraneousValues: true })
  }

  // Following
  async getFollowingLogs({
    currentUser,
    tvSeriesId,
    dto,
  }: {
    currentUser: User,
    tvSeriesId: number,
    dto: TvSeriesFollowingLogsQueryDto,
  }): Promise<TvSeriesFollowingLogDto[]> {
    const { has_rating } = dto;

    const whereClause = and(
      eq(logTvSeries.tvSeriesId, tvSeriesId),
      eq(follow.followerId, currentUser.id),
      eq(follow.status, 'accepted'),
      has_rating ? isNotNull(logTvSeries.rating) : undefined
    );

    const rows = await this.db
      .select({
        log: logTvSeries,
        review: reviewTvSeries,
        user: USER_COMPACT_SELECT,
      })
      .from(logTvSeries)
      .innerJoin(follow, eq(follow.followingId, logTvSeries.userId))
      .innerJoin(user, eq(user.id, logTvSeries.userId))
      .innerJoin(profile, eq(profile.id, user.id))
      .leftJoin(reviewTvSeries, eq(reviewTvSeries.id, logTvSeries.id))
      .where(whereClause)
      .groupBy(
        logTvSeries.id,
        user.id,
        profile.id,
        reviewTvSeries.id
      )
      .orderBy(desc(logTvSeries.createdAt));

    return plainToInstance(TvSeriesFollowingLogDto, rows.map(row => ({
      ...row.log,
      user: row.user,
      review: row.review ? {
        ...row.review,
        userId: row.log.userId,
        tvSeriesId: row.log.tvSeriesId,
      } : null,
    })));
  }

  async getFollowingAverageRating({
    currentUser, 
    tvSeriesId,
  }: {
    currentUser: User,
    tvSeriesId: number,
  }): Promise<TvSeriesFollowingAverageRatingDto> {
    const [result] = await this.db
      .select({
        average: avg(logTvSeries.rating),
      })
      .from(logTvSeries)
      .innerJoin(follow, eq(follow.followingId, logTvSeries.userId))
      .where(
        and(
          eq(logTvSeries.tvSeriesId, tvSeriesId),
          eq(follow.followerId, currentUser.id),
          eq(follow.status, 'accepted'),
          isNotNull(logTvSeries.rating)
        )
      );

    const averageValue = result?.average ? Number(result.average) : null;

    return plainToInstance(TvSeriesFollowingAverageRatingDto, {
      averageRating: averageValue !== null ? Math.round(averageValue * 10) / 10 : null,
    });
  }
}