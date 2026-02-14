import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DRIZZLE_SERVICE, DrizzleService } from '../../common/modules/drizzle.module';
import { tmdbTvSeriesView } from '@libs/db/schemas';
import { eq, sql } from 'drizzle-orm';
import { User } from '../auth/auth.service';
import { SupportedLocale } from '@libs/i18n';
import { TvSeriesDto } from './dto/tv-series.dto';

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
}
