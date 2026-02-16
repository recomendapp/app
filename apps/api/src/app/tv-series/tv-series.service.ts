import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DRIZZLE_SERVICE, DrizzleService } from '../../common/modules/drizzle.module';
import { tmdbPersonView, tmdbTvSeriesCredit, tmdbTvSeriesRole, tmdbTvSeriesView } from '@libs/db/schemas';
import { and, asc, eq, sql } from 'drizzle-orm';
import { User } from '../auth/auth.service';
import { SupportedLocale } from '@libs/i18n';
import { TvSeriesDto } from './dto/tv-series.dto';
import { TvSeriesCastingDto } from './dto/tv-series-credits.dto';

@Injectable()
export class TvSeriesService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  async get({
    tvSeriesId,
    currentUser,
    locale,
  }: {
    tvSeriesId: number;
    currentUser: User | null;
    locale: SupportedLocale;
  }): Promise<TvSeriesDto> {
    return await this.db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT set_config('app.current_language', ${locale}, true)`
      );
      if (currentUser) {
        await tx.execute(
          sql`SELECT set_config('app.current_user_id', ${currentUser.id}, true)`
        );
      }

      const [tvSeries] = await tx
        .select()
        .from(tmdbTvSeriesView)
        .where(eq(tmdbTvSeriesView.id, tvSeriesId))
        .limit(1);

      if (!tvSeries) {
        throw new NotFoundException(`TV Series with id ${tvSeriesId} not found`);
      }

      return tvSeries;
    });
  }

  async getCasting({
    tvSeriesId,
    locale,
  }: {
    tvSeriesId: number;
    locale: SupportedLocale;
  }): Promise<TvSeriesCastingDto[]> {
    return await this.db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT set_config('app.current_language', ${locale}, true)`
      );

      const aggregatedCastingSq = tx
        .select({
          tvSeriesId: tmdbTvSeriesCredit.tvSeriesId, 
          personId: tmdbTvSeriesCredit.personId,
          order: sql<number>`MIN(${tmdbTvSeriesRole.order})`.as('min_order'),
          roles: sql<Pick<typeof tmdbTvSeriesRole.$inferSelect, 'character' | 'order'>[]>`
            jsonb_agg(
              jsonb_build_object(
                'character', ${tmdbTvSeriesRole.character},
                'order', ${tmdbTvSeriesRole.order}
              ) ORDER BY ${tmdbTvSeriesRole.order} ASC
            )
          `.as('roles_agg'),
        })
        .from(tmdbTvSeriesCredit)
        .leftJoin(tmdbTvSeriesRole, eq(tmdbTvSeriesRole.creditId, tmdbTvSeriesCredit.id))
        .where(
          and(
            eq(tmdbTvSeriesCredit.tvSeriesId, tvSeriesId),
            eq(tmdbTvSeriesCredit.job, 'Actor')
          )
        )
        .groupBy(tmdbTvSeriesCredit.tvSeriesId, tmdbTvSeriesCredit.personId)
        .as('aggregated_casting');

      const castingData = await tx
        .select({
          tvSeriesId: aggregatedCastingSq.tvSeriesId,
          personId: aggregatedCastingSq.personId,
          order: aggregatedCastingSq.order,
          roles: aggregatedCastingSq.roles,
          person: {
            id: tmdbPersonView.id,
            name: tmdbPersonView.name,
            profilePath: tmdbPersonView.profilePath,
            slug: tmdbPersonView.slug,
            url: tmdbPersonView.url,
          },
        })
        .from(aggregatedCastingSq)
        .innerJoin(tmdbPersonView, eq(tmdbPersonView.id, aggregatedCastingSq.personId))
        .orderBy(asc(aggregatedCastingSq.order));
      
      return castingData;
    });
  }
}
