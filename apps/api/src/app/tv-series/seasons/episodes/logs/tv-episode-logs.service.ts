import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../../../common/modules/drizzle/drizzle.module';
import { User } from '../../../../auth/auth.service';
import { logTvEpisode, logTvSeries, tmdbTvEpisode, tmdbTvSeason } from '@libs/db/schemas';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { LogTvEpisodeDto, LogTvEpisodeRequestDto, LogTvEpisodeUpdateResponseDto } from './tv-episode-logs.dto';
import { plainToInstance } from 'class-transformer';
import { TvLogsSyncService } from '../../../logs/sync/tv-logs-sync.service';

@Injectable()
export class TvEpisodeLogsService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
    private readonly syncService: TvLogsSyncService,
  ) {}

  async get({
    currentUser,
    tvSeriesId,
    seasonNumber,
    episodeNumber,
  }: {
    currentUser: User;
    tvSeriesId: number;
    seasonNumber: number;
    episodeNumber: number;
  }): Promise<LogTvEpisodeDto | null> {
    const [logEntry] = await this.db.select({ episode: logTvEpisode })
      .from(logTvEpisode)
      .innerJoin(logTvSeries, eq(logTvSeries.id, logTvEpisode.logTvSeriesId))
      .where(
        and(
          eq(logTvSeries.userId, currentUser.id),
          eq(logTvSeries.tvSeriesId, tvSeriesId),
          eq(logTvEpisode.seasonNumber, seasonNumber),
          eq(logTvEpisode.episodeNumber, episodeNumber)
        )
      )
      .limit(1);

    if (!logEntry) return null;
    return plainToInstance(LogTvEpisodeDto, logEntry.episode, { excludeExtraneousValues: true });
  }

  async set({
    currentUser,
    tvSeriesId,
    seasonNumber,
    episodeNumber,
    dto,
  }: {
    currentUser: User;
    tvSeriesId: number;
    seasonNumber: number;
    episodeNumber: number;
    dto: LogTvEpisodeRequestDto;
  }): Promise<LogTvEpisodeUpdateResponseDto> {
    const result = await this.db.transaction(async (tx) => {
      const [tmdbEp] = await tx.select({ id: tmdbTvEpisode.id })
        .from(tmdbTvEpisode)
        .innerJoin(tmdbTvSeason, eq(tmdbTvSeason.id, tmdbTvEpisode.tvSeasonId))
        .where(
          and(
            eq(tmdbTvSeason.tvSeriesId, tvSeriesId),
            eq(tmdbTvSeason.seasonNumber, seasonNumber),
            eq(tmdbTvEpisode.episodeNumber, episodeNumber)
          )
        );

      if (!tmdbEp) throw new NotFoundException('TMDB Episode not found');

      const parents = await this.syncService.ensureParentsExist(tx, currentUser.id, tvSeriesId, seasonNumber);

      const [episodeLog] = await tx.insert(logTvEpisode).values({
        logTvSeriesId: parents.logTvSeriesId,
        logTvSeasonId: parents.logTvSeasonId,
        tvEpisodeId: tmdbEp.id,
        seasonNumber,
        episodeNumber,
        rating: dto.rating,
        ratedAt: dto.rating != null ? sql`now()` : null,
      })
      .onConflictDoUpdate({
        target: [logTvEpisode.logTvSeasonId, logTvEpisode.tvEpisodeId],
        set: {
          watchedAt: sql`now()`,
          rating: dto.rating !== undefined ? dto.rating : sql`${logTvEpisode.rating}`,
          ratedAt: dto.rating !== undefined ? (dto.rating != null ? sql`now()` : null) : sql`${logTvEpisode.ratedAt}`,
        }
      }).returning();

      const { series, season } = await this.syncService.syncTree(tx, currentUser.id, tvSeriesId, seasonNumber);

      return {
        episode: episodeLog,
        season: season,
        series: series
      };
    });

    return plainToInstance(LogTvEpisodeUpdateResponseDto, result, { excludeExtraneousValues: true });
  }

  async delete({
    currentUser,
    tvSeriesId,
    seasonNumber,
    episodeNumber,
  }: {
    currentUser: User;
    tvSeriesId: number;
    seasonNumber: number;
    episodeNumber: number;
  }): Promise<LogTvEpisodeUpdateResponseDto> {
    const result = await this.db.transaction(async (tx) => {      
      const episodeIdSubquery = tx
        .select({ id: logTvEpisode.id })
        .from(logTvEpisode)
        .innerJoin(logTvSeries, eq(logTvSeries.id, logTvEpisode.logTvSeriesId))
        .where(
          and(
            eq(logTvSeries.userId, currentUser.id),
            eq(logTvSeries.tvSeriesId, tvSeriesId),
            eq(logTvEpisode.seasonNumber, seasonNumber),
            eq(logTvEpisode.episodeNumber, episodeNumber)
          )
        );

      const [deletedEpisode] = await tx
        .delete(logTvEpisode)
        .where(inArray(logTvEpisode.id, episodeIdSubquery))
        .returning();

      if (!deletedEpisode) {
        throw new NotFoundException('Episode log not found');
      }

      const { series, season } = await this.syncService.syncTree(tx, currentUser.id, tvSeriesId, seasonNumber);

      return {
        episode: deletedEpisode,
        season: season,
        series: series
      };
    });

    return plainToInstance(LogTvEpisodeUpdateResponseDto, result, { excludeExtraneousValues: true });
  }
}