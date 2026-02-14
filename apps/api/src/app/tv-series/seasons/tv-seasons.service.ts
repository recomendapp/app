import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle.module';
import { and, eq, sql } from 'drizzle-orm';
import { User } from '../../auth/auth.service';
import { SupportedLocale } from '@libs/i18n';
import { TvSeasonGetDTO } from './dto/tv-seasons.dto';
import { tmdbTvSeasonView, tmdbTvSeriesView } from '@libs/db/schemas';

@Injectable()
export class TvSeasonsService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  async get({
    tvSeriesId,
    seasonNumber,
    currentUser,
    locale,
  }: {
    tvSeriesId: number;
    seasonNumber: number;
    currentUser: User | null;
    locale: SupportedLocale;
  }): Promise<TvSeasonGetDTO> {
    return await this.db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT set_config('app.current_language', ${locale}, true)`
      );
      if (currentUser) {
        await tx.execute(
          sql`SELECT set_config('app.current_user_id', ${currentUser.id}, true)`
        );
      }

      const [tvSeason] = await tx
        .select({
          id: tmdbTvSeasonView.id,
          tvSeriesId: tmdbTvSeasonView.tvSeriesId,
          seasonNumber: tmdbTvSeasonView.seasonNumber,
          name: tmdbTvSeasonView.name,
          overview: tmdbTvSeasonView.overview,
          posterPath: tmdbTvSeasonView.posterPath,
          episodeCount: tmdbTvSeasonView.episodeCount,
          voteAverage: tmdbTvSeasonView.voteAverage,
          voteCount: tmdbTvSeasonView.voteCount,
          url: sql<string>`'/tv-series/' || ${tmdbTvSeriesView.slug} || '/season/' || ${tmdbTvSeasonView.seasonNumber}`,
          tvSeries: {
            id: tmdbTvSeriesView.id,
            name: tmdbTvSeriesView.name,
            slug: tmdbTvSeriesView.slug,
            url: tmdbTvSeriesView.url,
          }
        })
        .from(tmdbTvSeasonView)
        .innerJoin(
          tmdbTvSeriesView,
          eq(tmdbTvSeasonView.tvSeriesId, tmdbTvSeriesView.id)
        )
        .where(
          and(
            eq(tmdbTvSeasonView.tvSeriesId, tvSeriesId),
            eq(tmdbTvSeasonView.seasonNumber, seasonNumber)
          )
        )
        .limit(1);
        

      if (!tvSeason) {
        throw new NotFoundException(`TV Season with tvSeriesId ${tvSeriesId} and seasonNumber ${seasonNumber} not found`);
      }

      return tvSeason;
    });
  }
}
