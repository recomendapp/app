import { Inject, Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { imageType, tmdbMovieImage } from '@libs/db/schemas';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle/drizzle.module';
import { SupportedLocale } from '@libs/i18n';
import { plainToInstance } from 'class-transformer';
import { BaseCursor, decodeCursor, encodeCursor } from '../../../utils/cursor';
import { 
  ListInfiniteMovieImagesDto, 
  ListInfiniteMovieImagesQueryDto, 
  ListPaginatedMovieImagesDto, 
  ListPaginatedMovieImagesQueryDto, 
} from './movie-images.dto';

@Injectable()
export class MovieImagesService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  private getListBaseQuery(movieId: number, type?: typeof imageType.enumValues[number]) {
    const whereConditions = [eq(tmdbMovieImage.movieId, movieId)];
    if (type) {
      whereConditions.push(eq(tmdbMovieImage.type, type));
    }
    return and(...whereConditions);
  }

  private getOrderBySql() {
    return sql`
      (
        CASE
          WHEN ${tmdbMovieImage.iso6391} = (language.requested_language).iso_639_1 THEN 1
          WHEN ${tmdbMovieImage.iso6391} = (language.fallback_language).iso_639_1 THEN 2
          WHEN ${tmdbMovieImage.iso6391} = (language.default_language).iso_639_1 THEN 3
          WHEN ${tmdbMovieImage.iso6391} IS NULL THEN 4
          ELSE 5
        END
      ) ASC,
      ${tmdbMovieImage.voteAverage} DESC NULLS LAST,
      ${tmdbMovieImage.id} ASC
    `;
  }

  async listPaginated({
    movieId,
    query,
    locale,
  }: {
    movieId: number;
    query: ListPaginatedMovieImagesQueryDto;
    locale: SupportedLocale;
  }): Promise<ListPaginatedMovieImagesDto> {
    return await this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_language', ${locale}, true)`);

      const { per_page, page, type } = query;
      const offset = (page - 1) * per_page;

      const baseWhereClause = this.getListBaseQuery(movieId, type);

      const [rows, [{ count: totalCount }]] = await Promise.all([
        tx.select(({ movie_image: tmdbMovieImage }))
          .from(tmdbMovieImage)
          .innerJoin(sql`LATERAL i18n.language() language(requested_language, fallback_language, default_language)`, sql`true`)
          .where(baseWhereClause)
          .orderBy(this.getOrderBySql())
          .limit(per_page)
          .offset(offset),
          
        tx.select({ count: sql<number>`cast(count(*) as int)` })
          .from(tmdbMovieImage)
          .where(baseWhereClause)
      ]);

      return plainToInstance(ListPaginatedMovieImagesDto, {
        data: rows.map(row => row.movie_image), 
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
    movieId,
    query,
    locale,
  }: {
    movieId: number;
    query: ListInfiniteMovieImagesQueryDto;
    locale: SupportedLocale;
  }): Promise<ListInfiniteMovieImagesDto> {
    return await this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_language', ${locale}, true)`);

      const { per_page, cursor, type } = query;
      const cursorData = cursor ? decodeCursor<BaseCursor<number, number>>(cursor) : null;

      const baseWhereClause = this.getListBaseQuery(movieId, type);
      
      let cursorWhereClause;
      if (cursorData) {
        cursorWhereClause = sql`(${tmdbMovieImage.id}) > (${Number(cursorData.id)})`;
      }

      const finalWhereClause = cursorWhereClause 
        ? and(baseWhereClause, cursorWhereClause) 
        : baseWhereClause;

      const fetchLimit = per_page + 1;

      const results = await tx.select(({ movie_image: tmdbMovieImage }))
        .from(tmdbMovieImage)
        .innerJoin(sql`LATERAL i18n.language() language(requested_language, fallback_language, default_language)`, sql`true`)
        .where(finalWhereClause)
        .orderBy(this.getOrderBySql())
        .limit(fetchLimit);

      const hasNextPage = results.length > per_page;
      const paginatedResults = hasNextPage ? results.slice(0, per_page) : results;

      let nextCursor: string | null = null;
      if (hasNextPage) {
        const lastItem = paginatedResults[paginatedResults.length - 1].movie_image;
        nextCursor = encodeCursor({
          value: lastItem.id,
          id: lastItem.id,
        });
      }

      return plainToInstance(ListInfiniteMovieImagesDto, {
        data: paginatedResults.map(row => row.movie_image),
        meta: {
          next_cursor: nextCursor,
          per_page,
        },
      }, { excludeExtraneousValues: true });
    });
  }
}