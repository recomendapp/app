import { Injectable, Inject } from '@nestjs/common';
import { logTvSeries, logTvSeason, tmdbTvSeries, tmdbTvSeason, bookmark } from '@libs/db/schemas';
import { eq, and, sql } from 'drizzle-orm';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../../common/modules/drizzle/drizzle.module';
import { DbTransaction } from '@libs/db';
import { RecosService } from '../../../recos/recos.service';
import { RecoType } from '../../../recos/dto/recos.dto';

@Injectable()
export class TvLogsSyncService {
	constructor(
		@Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
		private readonly recosService: RecosService,
	) {}

	async syncTree(tx: DbTransaction, userId: string, tvSeriesId: number, seasonNumber?: number) {
		const [seriesLog] = await tx.select().from(logTvSeries).where(and(eq(logTvSeries.userId, userId), eq(logTvSeries.tvSeriesId, tvSeriesId)));
		
		if (!seriesLog) return { series: null, season: null };

		await tx.execute(sql`
		UPDATE log_tv_season s
		SET 
			episodes_watched_count = COALESCE(e.count, 0),
			status = CASE 
					WHEN COALESCE(e.count, 0) >= tmdb.episode_count THEN 'completed'::log_tv_status 
					ELSE 'watching'::log_tv_status 
					END,
			updated_at = now()
		FROM tmdb.tv_season tmdb
		LEFT JOIN (
			SELECT log_tv_season_id, COUNT(*) as count
			FROM log_tv_episode
			WHERE log_tv_series_id = ${seriesLog.id}
			GROUP BY log_tv_season_id
		) e ON e.log_tv_season_id = s.id
		WHERE s.log_tv_series_id = ${seriesLog.id} AND s.tv_season_id = tmdb.id
		`);

		const [tmdbSeries] = await tx.select({ totalEpisodes: tmdbTvSeries.numberOfEpisodes }).from(tmdbTvSeries).where(eq(tmdbTvSeries.id, tvSeriesId));
		
		const [seriesStats] = await tx.select({
				totalWatched: sql<number>`COALESCE(SUM(${logTvSeason.episodesWatchedCount}), 0)::integer`
			})
			.from(logTvSeason)
			.where(
				and(
					eq(logTvSeason.logTvSeriesId, seriesLog.id),
					sql`${logTvSeason.seasonNumber} > 0`
				)
			);

		const newWatchedCount = seriesStats?.totalWatched || 0;
		
		const newStatus = seriesLog.status === 'dropped' ? 'dropped' : (newWatchedCount >= tmdbSeries.totalEpisodes ? 'completed' : 'watching');

		await tx.update(logTvSeries)
			.set({
				episodesWatchedCount: newWatchedCount,
				status: newStatus,
			})
			.where(eq(logTvSeries.id, seriesLog.id));

		const [updatedSeries] = await tx.select().from(logTvSeries).where(eq(logTvSeries.id, seriesLog.id));
		
		let updatedSeason: typeof logTvSeason.$inferSelect | null = null;
		if (seasonNumber !== undefined) {
			const [season] = await tx.select().from(logTvSeason)
				.where(and(eq(logTvSeason.logTvSeriesId, seriesLog.id), eq(logTvSeason.seasonNumber, seasonNumber)));
			updatedSeason = season || null;
		}

		return {
			series: updatedSeries,
			season: updatedSeason,
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