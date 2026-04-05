import { Inject, Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { 
  uiBackground, 
  tmdbMovieView, 
  tmdbTvSeriesView, 
  tmdbMovieImage, 
  tmdbTvSeriesImage 
} from '@libs/db/schemas';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle/drizzle.module';
import { SupportedLocale } from '@libs/i18n';
import { MOVIE_COMPACT_SELECT, TV_SERIES_COMPACT_SELECT } from '@libs/db/selectors';
import { ListAllUiBackgroundsQueryDto, UiBackgroundWithMediaUnion, UiBackgroundWithMovieDto, UiBackgroundWithTvSeriesDto } from './ui-backgrounds.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class UiBackgroundsService {
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
          movieImagePath: tmdbMovieImage.filePath,
          tvSeriesImagePath: tmdbTvSeriesImage.filePath,
          movieId: tmdbMovieImage.movieId,
          tvSeriesId: tmdbTvSeriesImage.tvSeriesId,
          movie: MOVIE_COMPACT_SELECT,
          tvSeries: TV_SERIES_COMPACT_SELECT,
        })
        .from(uiBackground)
        .leftJoin(tmdbMovieImage, eq(uiBackground.movieImageId, tmdbMovieImage.id))
        .leftJoin(tmdbTvSeriesImage, eq(uiBackground.tvSeriesImageId, tmdbTvSeriesImage.id))
        .leftJoin(tmdbMovieView, eq(tmdbMovieImage.movieId, tmdbMovieView.id))
        .leftJoin(tmdbTvSeriesView, eq(tmdbTvSeriesImage.tvSeriesId, tmdbTvSeriesView.id))
        .where(whereClause);

      return results.map((row): UiBackgroundWithMediaUnion => {
        if (row.bg.type === 'movie') {
          return plainToInstance(UiBackgroundWithMovieDto,{
            ...row.bg,
            type: 'movie',
            filePath: row.movieImagePath,
            mediaId: row.movieId,
            media: row.movie,
          }, { excludeExtraneousValues: true });
        }
        
        return plainToInstance(UiBackgroundWithTvSeriesDto, {
          ...row.bg,
          type: 'tv_series',
          filePath: row.tvSeriesImagePath,
          mediaId: row.tvSeriesId,
          media: row.tvSeries,
        }, { excludeExtraneousValues: true });
      });
    });
  }
}