import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { logTvSeries, tmdbTvSeries } from '@libs/db/schemas';
import { plainToInstance } from 'class-transformer';
import { WorkerClient } from '@shared/worker';
import { LogTvSeriesDto, LogTvSeriesRequestDto } from './tv-series-logs.dto';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle/drizzle.module';
import { TvLogsSyncService } from './sync/tv-logs-sync.service';
import { User } from '../../auth/auth.service';

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
      where: and(
        eq(logTvSeries.userId, currentUser.id),
        eq(logTvSeries.tvSeriesId, tvSeriesId),
      ),
      with: {
        review: true
      }
    });

    if (!logEntry) return null;


    return plainToInstance(LogTvSeriesDto, {
      ...logEntry,
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
        status: dto.status || 'watching',
      })
      .onConflictDoUpdate({
        target: [logTvSeries.tvSeriesId, logTvSeries.userId],
        set: {
          rating: dto.rating !== undefined ? dto.rating : sql`${logTvSeries.rating}`,
          ratedAt: dto.rating !== undefined ? (dto.rating != null ? sql`now()` : null) : sql`${logTvSeries.ratedAt}`,
          isLiked: dto.isLiked !== undefined ? dto.isLiked : sql`${logTvSeries.isLiked}`,
          likedAt: dto.isLiked !== undefined ? (dto.isLiked ? sql`now()` : null) : sql`${logTvSeries.likedAt}`,
          status: dto.status !== undefined ? dto.status : sql`${logTvSeries.status}`,
          updatedAt: sql`now()`
        }
      }).returning();

      isInserted = seriesLog.createdAt === seriesLog.updatedAt;
      finalLogId = seriesLog.id;

      if (dto.status === 'completed') {
        await tx.execute(sql`
          INSERT INTO log_tv_season (log_tv_series_id, tv_season_id, season_number, status)
          SELECT ${seriesLog.id}, id, season_number, 'completed'
          FROM tmdb.tv_season
          WHERE tv_series_id = ${tvSeriesId} AND season_number > 0
          ON CONFLICT DO NOTHING
        `);

        await tx.execute(sql`
          INSERT INTO log_tv_episode (log_tv_series_id, log_tv_season_id, tv_episode_id, season_number, episode_number, watched_at)
          SELECT ${seriesLog.id}, s.id, e.id, e.season_number, e.episode_number, now()
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
      with: { review: true }
    });

    const seriesDto = plainToInstance(LogTvSeriesDto, {
      ...completeLog,
      review: completeLog.review ? {
        ...completeLog.review,
        userId: completeLog.userId,
        tvSeriesId: completeLog.tvSeriesId,
      } : null,
    }, { excludeExtraneousValues: true });

    return seriesDto;
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
      review: deletedLog.review ? {
        ...deletedLog.review,
        userId: deletedLog.userId,
        tvSeriesId: deletedLog.tvSeriesId,
      } : null,
    });
  }
}