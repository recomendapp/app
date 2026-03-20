import { Injectable, Inject } from '@nestjs/common';
import { logTvSeries, logTvSeason, tmdbTvSeries, tmdbTvSeason, bookmark, reviewTvSeries } from '@libs/db/schemas';
import { eq, and, sql } from 'drizzle-orm';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../../common/modules/drizzle/drizzle.module';
import { DbTransaction } from '@libs/db';
import { RecosService } from '../../../recos/recos.service';
import { RecoType } from '../../../recos/dto/recos.dto';
import { LogTvSeriesDto, LogTvStatus } from '../tv-series-logs.dto';
import { LogTvSeasonDto } from '../../seasons/logs/tv-season-logs.dto';

@Injectable()
export class TvLogsSyncService {
	constructor(
		@Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
		private readonly recosService: RecosService,
	) {}

	async syncTree(tx: DbTransaction, userId: string, tvSeriesId: number, seasonNumber?: number): Promise<{ series: LogTvSeriesDto | null; season: LogTvSeasonDto | null }> {
		await tx.execute(sql`
            WITH series_log AS (
                SELECT id
                FROM log_tv_series
                WHERE user_id      = ${userId}
                  AND tv_series_id = ${tvSeriesId}
            ),
            season_counts AS (
                SELECT log_tv_season_id, COUNT(*)::integer AS count
                FROM log_tv_episode
                WHERE log_tv_series_id = (SELECT id FROM series_log)
                GROUP BY log_tv_season_id
            ),
            _update_seasons AS (
                UPDATE log_tv_season s
                SET
                    episodes_watched_count = COALESCE(sc.count, 0),
                    updated_at             = now()
                FROM log_tv_season lts
                LEFT JOIN season_counts sc ON sc.log_tv_season_id = lts.id
                WHERE lts.log_tv_series_id = (SELECT id FROM series_log)
                  AND s.id                 = lts.id
                RETURNING s.season_number, s.episodes_watched_count
            )
            UPDATE log_tv_series
            SET
                episodes_watched_count = (
                    SELECT COALESCE(SUM(episodes_watched_count), 0)::integer
                    FROM _update_seasons
                    WHERE season_number > 0
                ),
                updated_at = now()
            WHERE id = (SELECT id FROM series_log)
        `);
 
		const [row] = await tx
			.select({
				series:              logTvSeries,
				seriesTotalEpisodes: tmdbTvSeries.numberOfEpisodes,
				season:              logTvSeason,
				seasonTotalEpisodes: tmdbTvSeason.episodeCount,
				review:              reviewTvSeries,
			})
			.from(logTvSeries)
			.innerJoin(
				tmdbTvSeries,
				eq(tmdbTvSeries.id, logTvSeries.tvSeriesId),
			)
			.leftJoin(
                reviewTvSeries,
                eq(reviewTvSeries.id, logTvSeries.id)
            )
			.leftJoin(
				logTvSeason,
				and(
					eq(logTvSeason.logTvSeriesId, logTvSeries.id),
					seasonNumber !== undefined
						? eq(logTvSeason.seasonNumber, seasonNumber)
						: sql`FALSE`,
				),
			)
			.leftJoin(
				tmdbTvSeason,
				eq(tmdbTvSeason.id, logTvSeason.tvSeasonId),
			)
			.where(
				and(
					eq(logTvSeries.userId,     userId),
					eq(logTvSeries.tvSeriesId, tvSeriesId),
				),
			)
			.limit(1);
 
		if (!row) return { series: null, season: null };

		return {
			series: {
				...row.series,
				status: (
					row.series.status !== 'dropped'
					&& row.seriesTotalEpisodes > 0
					&& row.series.episodesWatchedCount >= row.seriesTotalEpisodes
				) ? LogTvStatus.COMPLETED : row.series.status as LogTvStatus,
				review: row.review ? {
                    ...row.review,
                    userId: row.series.userId,
                    tvSeriesId: row.series.tvSeriesId,
                } : null,
			},
			season: row.season ? {
				...row.season,
				status: (
					row.season.status !== 'dropped'
					&& row.seasonTotalEpisodes > 0
					&& row.season.episodesWatchedCount >= row.seasonTotalEpisodes
				) ? LogTvStatus.COMPLETED : row.season.status as LogTvStatus,
			} : null,
		};
	}

	async ensureParentsExist(tx: DbTransaction, userId: string, tvSeriesId: number, seasonNumber?: number) {
		const [series] = await tx.insert(logTvSeries)
			.values({ userId, tvSeriesId, status: 'watching' })
			.onConflictDoUpdate({
				target: [logTvSeries.tvSeriesId, logTvSeries.userId], set: { id: sql`${logTvSeries.id}` } }) 
			.returning({
				id: logTvSeries.id,
				createdAt: logTvSeries.createdAt,
				updatedAt: logTvSeries.updatedAt,
			});
		
		const isNewSeriesLog = series.createdAt === series.updatedAt;
		if (isNewSeriesLog) {
			await tx.update(bookmark)
                .set({ status: 'completed' })
                .where(
                    and(
                        eq(bookmark.userId, userId),
                        eq(bookmark.tvSeriesId, tvSeriesId),
                        eq(bookmark.type, RecoType.TV_SERIES),
                        eq(bookmark.status, 'active')
                    )
                );
            
            await this.recosService.complete({
                userId,
                type: RecoType.TV_SERIES,
                mediaId: tvSeriesId,
                tx,
            });
		}

		let seasonId: number | null = null;
		if (seasonNumber !== undefined) {
		const [tmdbSeason] = await tx.select({ id: tmdbTvSeason.id }).from(tmdbTvSeason).where(and(eq(tmdbTvSeason.tvSeriesId, tvSeriesId), eq(tmdbTvSeason.seasonNumber, seasonNumber)));
		if (tmdbSeason) {
			const [season] = await tx.insert(logTvSeason)
				.values({ logTvSeriesId: series.id, tvSeasonId: tmdbSeason.id, seasonNumber, status: 'watching' })
				.onConflictDoUpdate({ target: [logTvSeason.logTvSeriesId, logTvSeason.tvSeasonId], set: { id: sql`${logTvSeason.id}` } })
				.returning({ id: logTvSeason.id });
			seasonId = season.id;
		}
		}
		return { logTvSeriesId: series.id, logTvSeasonId: seasonId, isNewSeriesLog };
	}
}