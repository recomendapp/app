import { Inject, Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { 
  uiBackground, 
  tmdbMovieView, 
  tmdbTvSeriesView, 
} from '@libs/db/schemas';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle/drizzle.module';
import { SupportedLocale } from '@libs/i18n';
import { MOVIE_COMPACT_SELECT, TV_SERIES_COMPACT_SELECT } from '@libs/db/selectors';
import { ListAllUiBackgroundsQueryDto, UiBackgroundWithMediaUnion, UiBackgroundWithMovieDto, UiBackgroundWithTvSeriesDto } from './ui-backgrounds.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class UiBackgroundsService {
  private readonly IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/original';

  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  async listAll({
    query,
    locale,
  }: {
    query: ListAllUiBackgroundsQueryDto;
    locale: SupportedLocale;
  }): Promise<UiBackgroundWithMediaUnion[]> {
    return await this.db.transaction(async (tx) => {
      await tx.execute(sql`SET LOCAL jit = off`);
      await tx.execute(sql`SELECT set_config('app.current_language', ${locale}, true)`);

      const whereClause = query.type ? eq(uiBackground.type, query.type) : undefined;

      const results = await tx.select({
          bg: uiBackground,
          movie: MOVIE_COMPACT_SELECT,
          tvSeries: TV_SERIES_COMPACT_SELECT,
        })
        .from(uiBackground)
        .leftJoin(tmdbMovieView, eq(uiBackground.movieId, tmdbMovieView.id))
        .leftJoin(tmdbTvSeriesView, eq(uiBackground.tvSeriesId, tmdbTvSeriesView.id))
        .where(whereClause);

      return results.map((row): UiBackgroundWithMediaUnion => {
        const imageUrl = `${this.IMAGE_BASE_URL}${row.bg.filePath}`;

        if (row.bg.type === 'movie') {
          return plainToInstance(UiBackgroundWithMovieDto,{
            ...row.bg,
            type: 'movie',
            url: imageUrl,
            mediaId: row.bg.movieId,
            media: row.movie,
          }, { excludeExtraneousValues: true });
        }
        
        return plainToInstance(UiBackgroundWithTvSeriesDto, {
          ...row.bg,
          type: 'tv_series',
          url: imageUrl,
          mediaId: row.bg.tvSeriesId,
          media: row.tvSeries,
        }, { excludeExtraneousValues: true });
      });
    });
  }
}