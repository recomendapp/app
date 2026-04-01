import { Inject, Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { imageType, tmdbTvSeriesImage } from '@libs/db/schemas';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle/drizzle.module';
import { SupportedLocale } from '@libs/i18n';
import { plainToInstance } from 'class-transformer';
import { BaseCursor, decodeCursor, encodeCursor } from '../../../utils/cursor';
import { 
  ListInfiniteTvSeriesImagesDto, 
  ListInfiniteTvSeriesImagesQueryDto, 
  ListPaginatedTvSeriesImagesDto, 
  ListPaginatedTvSeriesImagesQueryDto, 
} from './tv-series-images.dto';

@Injectable()
export class TvSeriesImagesService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  private getListBaseQuery(tvSeriesId: number, type?: typeof imageType.enumValues[number]) {
    const whereConditions = [eq(tmdbTvSeriesImage.tvSeriesId, tvSeriesId)];
    if (type) {
      whereConditions.push(eq(tmdbTvSeriesImage.type, type));
    }
    return and(...whereConditions);
  }

  private getOrderBySql() {
    return sql`
      (
        CASE
          WHEN ${tmdbTvSeriesImage.iso6391} = (language.requested_language).iso_639_1 THEN 1
          WHEN ${tmdbTvSeriesImage.iso6391} = (language.fallback_language).iso_639_1 THEN 2
          WHEN ${tmdbTvSeriesImage.iso6391} = (language.default_language).iso_639_1 THEN 3
          WHEN ${tmdbTvSeriesImage.iso6391} IS NULL THEN 4
          ELSE 5
        END
      ) ASC,
      ${tmdbTvSeriesImage.voteAverage} DESC NULLS LAST,
      ${tmdbTvSeriesImage.id} ASC
    `;
  }

  async listPaginated({
    tvSeriesId,
    query,
    locale,
  }: {
    tvSeriesId: number;
    query: ListPaginatedTvSeriesImagesQueryDto;
    locale: SupportedLocale;
  }): Promise<ListPaginatedTvSeriesImagesDto> {
    return await this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_language', ${locale}, true)`);

      const { per_page, page, type } = query;
      const offset = (page - 1) * per_page;

      const baseWhereClause = this.getListBaseQuery(tvSeriesId, type);

      const [rows, [{ count: totalCount }]] = await Promise.all([
        tx.select()
          .from(tmdbTvSeriesImage)
          .innerJoin(sql`LATERAL i18n.language() language(requested_language, fallback_language, default_language)`, sql`true`)
          .where(baseWhereClause)
          .orderBy(this.getOrderBySql())
          .limit(per_page)
          .offset(offset),
          
        tx.select({ count: sql<number>`cast(count(*) as int)` })
          .from(tmdbTvSeriesImage)
          .where(baseWhereClause)
      ]);

      return plainToInstance(ListPaginatedTvSeriesImagesDto, {
        data: rows.map(row => row.tv_series_image),
        meta: {
          total_results: totalCount,
          total_pages: Math.ceil(totalCount / per_page),
          current_page: page,
          per_page,
        },
      }, { excludeExtraneousValues: true });
    });
  }

  async listInfinite({
    tvSeriesId,
    query,
    locale,
  }: {
    tvSeriesId: number;
    query: ListInfiniteTvSeriesImagesQueryDto;
    locale: SupportedLocale;
  }): Promise<ListInfiniteTvSeriesImagesDto> {
    return await this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_language', ${locale}, true)`);

      const { per_page, cursor, type } = query;
      const cursorData = cursor ? decodeCursor<BaseCursor<number, number>>(cursor) : null;

      const baseWhereClause = this.getListBaseQuery(tvSeriesId, type);
      
      let cursorWhereClause;
      if (cursorData) {
        cursorWhereClause = sql`(${tmdbTvSeriesImage.id}) > (${Number(cursorData.id)})`;
      }

      const finalWhereClause = cursorWhereClause 
        ? and(baseWhereClause, cursorWhereClause) 
        : baseWhereClause;

      const fetchLimit = per_page + 1;

      const results = await tx.select()
        .from(tmdbTvSeriesImage)
        .innerJoin(sql`LATERAL i18n.language() language(requested_language, fallback_language, default_language)`, sql`true`)
        .where(finalWhereClause)
        .orderBy(this.getOrderBySql())
        .limit(fetchLimit);

      const hasNextPage = results.length > per_page;
      const paginatedResults = hasNextPage ? results.slice(0, per_page) : results;

      let nextCursor: string | null = null;
      if (hasNextPage) {
        const lastItem = paginatedResults[paginatedResults.length - 1].tv_series_image;
        nextCursor = encodeCursor({
          value: lastItem.id,
          id: lastItem.id,
        });
      }

      return plainToInstance(ListInfiniteTvSeriesImagesDto, {
        data: paginatedResults.map(row => row.tv_series_image),
        meta: {
          next_cursor: nextCursor,
          per_page,
        },
      }, { excludeExtraneousValues: true });
    });
  }
}