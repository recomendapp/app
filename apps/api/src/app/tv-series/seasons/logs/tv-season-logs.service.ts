import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../../common/modules/drizzle/drizzle.module';
import { User } from '../../../auth/auth.service';
import { logTvSeason, logTvSeries } from '@libs/db/schemas';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { plainToInstance } from 'class-transformer';
import { LogTvSeasonDto, LogTvSeasonRequestDto, LogTvSeasonUpdateResponseDto } from './tv-season-logs.dto';
import { TvLogsSyncService } from '../../logs/sync/tv-logs-sync.service';

@Injectable()
export class TvSeasonLogsService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
    private readonly syncService: TvLogsSyncService,
  ) {}

  async get({
    currentUser,
    tvSeriesId,
    seasonNumber,
  }: {
    currentUser: User;
    tvSeriesId: number;
    seasonNumber: number;
  }): Promise<LogTvSeasonDto | null> {
    const [logEntry] = await this.db.select({ season: logTvSeason })
      .from(logTvSeason)
      .innerJoin(logTvSeries, eq(logTvSeries.id, logTvSeason.logTvSeriesId))
      .where(
        and(
          eq(logTvSeries.userId, currentUser.id),
          eq(logTvSeries.tvSeriesId, tvSeriesId),
          eq(logTvSeason.seasonNumber, seasonNumber)
        )
      )
      .limit(1);

    if (!logEntry) return null;
    return plainToInstance(LogTvSeasonDto, logEntry.season, { excludeExtraneousValues: true });
  }

  async set({
    currentUser,
    tvSeriesId,
    seasonNumber,
    dto,
  }: {
    currentUser: User;
    tvSeriesId: number;
    seasonNumber: number;
    dto: LogTvSeasonRequestDto;
  }): Promise<LogTvSeasonUpdateResponseDto> {    
    const result = await this.db.transaction(async (tx) => {
      
      const parents = await this.syncService.ensureParentsExist(tx, currentUser.id, tvSeriesId, seasonNumber);

      if (!parents.logTvSeasonId) {
          throw new NotFoundException('TMDB Season not found');
      }

      if (dto.status === 'completed') {
        await tx.execute(sql`
          INSERT INTO log_tv_episode (log_tv_series_id, log_tv_season_id, tv_episode_id, season_number, episode_number, watched_at)
          SELECT ${parents.logTvSeriesId}, ${parents.logTvSeasonId}, id, season_number, episode_number, now()
          FROM tmdb.tv_episode
          WHERE tv_season_id = (
            SELECT id FROM tmdb.tv_season WHERE tv_series_id = ${tvSeriesId} AND season_number = ${seasonNumber}
          )
          ON CONFLICT DO NOTHING
        `);
      }

      await tx.update(logTvSeason)
        .set({
          rating: dto.rating !== undefined ? dto.rating : sql`${logTvSeason.rating}`,
          ratedAt: dto.rating !== undefined ? (dto.rating != null ? sql`now()` : null) : sql`${logTvSeason.ratedAt}`,
          status: dto.status !== undefined ? dto.status : sql`${logTvSeason.status}`, 
        })
        .where(eq(logTvSeason.id, parents.logTvSeasonId));

      const { season, series } = await this.syncService.syncTree(tx, currentUser.id, tvSeriesId, seasonNumber);

      return { season, series };
    });

    return plainToInstance(LogTvSeasonUpdateResponseDto, result, { excludeExtraneousValues: true });
  }

  async delete({
    currentUser,
    tvSeriesId,
    seasonNumber,
  }: {
    currentUser: User;
    tvSeriesId: number;
    seasonNumber: number;
  }): Promise<LogTvSeasonUpdateResponseDto> {
    const result = await this.db.transaction(async (tx) => {
      const seasonIdSubquery = tx
        .select({ id: logTvSeason.id })
        .from(logTvSeason)
        .innerJoin(logTvSeries, eq(logTvSeries.id, logTvSeason.logTvSeriesId))
        .where(
          and(
            eq(logTvSeries.userId, currentUser.id),
            eq(logTvSeries.tvSeriesId, tvSeriesId),
            eq(logTvSeason.seasonNumber, seasonNumber)
          )
        );

      const [deletedSeason] = await tx
        .delete(logTvSeason)
        .where(inArray(logTvSeason.id, seasonIdSubquery))
        .returning();

      if (!deletedSeason) {
        throw new NotFoundException('Season log not found');
      }

      const { series } = await this.syncService.syncTree(tx, currentUser.id, tvSeriesId);

      return {
        season: deletedSeason, 
        series: series
      };
    });

    return plainToInstance(LogTvSeasonUpdateResponseDto, result, { excludeExtraneousValues: true });
  }
}