import { Inject, Injectable, Logger } from '@nestjs/common';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle/drizzle.module';
import { Cron, CronExpression } from '@nestjs/schedule';
import { mediaMostPopular, tmdbMovieView, tmdbTvSeriesView } from '@libs/db/schemas';
import { SortOrder } from '../../../common/dto/sort.dto';
import { and, asc, desc, eq, gt, lt, or, sql, SQL } from 'drizzle-orm';
import { MOVIE_COMPACT_SELECT, TV_SERIES_COMPACT_SELECT } from '@libs/db/selectors';
import { plainToInstance } from 'class-transformer';
import { BaseCursor, decodeCursor, encodeCursor } from '../../../utils/cursor';
import { SupportedLocale } from '@libs/i18n';
import { 
  ListInfiniteMediasMostPopularDto, 
  ListInfiniteMediasMostPopularQueryDto, 
  ListPaginatedMediasMostPopularDto, 
  ListPaginatedMediasMostPopularQueryDto, 
  MediaMostPopularSortBy 
} from './medias-most-popular.dto';

@Injectable()
export class MediasMostPopularService {
  private readonly logger = new Logger(MediasMostPopularService.name);

  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async refreshTrendingView() {
    this.logger.log('Starting refresh of mediaMostPopular view...');
    try {
      await this.db.refreshMaterializedView(mediaMostPopular);
      this.logger.log('Successfully refreshed mediaMostPopular view.');
    } catch (error) {
      this.logger.error('Failed to refresh mediaMostPopular view', error);
    }
  }

  private getListBaseQuery(sortBy: MediaMostPopularSortBy, sortOrder: SortOrder) {
    const direction = sortOrder === SortOrder.ASC ? asc : desc;
    
    const orderBy = (() => {
      switch (sortBy) {
        case MediaMostPopularSortBy.POPULARITY:
        default:
          return [direction(mediaMostPopular.popularity), direction(mediaMostPopular.mediaId)];
      }
    })();

    return { orderBy };
  }

  async listPaginated({
    query,
    locale,
  }: {
    query: ListPaginatedMediasMostPopularQueryDto;
    locale: SupportedLocale;
  }): Promise<ListPaginatedMediasMostPopularDto> {
    return await this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_language', ${locale}, true)`);
      await tx.execute(sql`SELECT set_config('app.current_user_id', '', true)`);

      const { per_page, sort_order, sort_by, page } = query;
      const offset = (page - 1) * per_page;
      const { orderBy } = this.getListBaseQuery(sort_by, sort_order);

      const [results, totalCount] = await Promise.all([
        tx.select({
          popular: {
            mediaId: mediaMostPopular.mediaId,
            type: mediaMostPopular.type,
            popularity: mediaMostPopular.popularity,
          },
          movie: MOVIE_COMPACT_SELECT,
          tvSeries: TV_SERIES_COMPACT_SELECT,
        })
          .from(mediaMostPopular)
          .leftJoin(tmdbMovieView, and(eq(mediaMostPopular.mediaId, tmdbMovieView.id), eq(mediaMostPopular.type, 'movie')))
          .leftJoin(tmdbTvSeriesView, and(eq(mediaMostPopular.mediaId, tmdbTvSeriesView.id), eq(mediaMostPopular.type, 'tv_series')))
          .orderBy(...orderBy)
          .limit(per_page)
          .offset(offset),
        tx.$count(mediaMostPopular),
      ]);

      return plainToInstance(ListPaginatedMediasMostPopularDto, {
        data: results.map((row) => ({
          type: row.popular.type,
          mediaId: row.popular.mediaId,
          popularity: row.popular.popularity,
          media: row.popular.type === 'movie' ? row.movie : row.tvSeries,
        })),
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
    query,
    locale,
  }: {
    query: ListInfiniteMediasMostPopularQueryDto;
    locale: SupportedLocale;
  }): Promise<ListInfiniteMediasMostPopularDto> {
    return await this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_language', ${locale}, true)`);
      await tx.execute(sql`SELECT set_config('app.current_user_id', '', true)`);

      const { per_page, sort_order, sort_by, cursor, include_total_count } = query;
      const cursorData = cursor ? decodeCursor<BaseCursor<string | number, number>>(cursor) : null;
      const { orderBy } = this.getListBaseQuery(sort_by, sort_order);

      let cursorWhereClause: SQL | undefined;
      if (cursorData) {
        const operator = sort_order === SortOrder.ASC ? gt : lt;
        cursorWhereClause = or(
          operator(mediaMostPopular.popularity, Number(cursorData.value)),
          and(
            eq(mediaMostPopular.popularity, Number(cursorData.value)),
            operator(mediaMostPopular.mediaId, cursorData.id)
          )
        );
      }

      const [results, totalCountResult] = await Promise.all([
        tx.select({
          popular: {
            mediaId: mediaMostPopular.mediaId,
            type: mediaMostPopular.type,
            popularity: mediaMostPopular.popularity,
          },
          movie: MOVIE_COMPACT_SELECT,
          tvSeries: TV_SERIES_COMPACT_SELECT,
        })
          .from(mediaMostPopular)
          .leftJoin(tmdbMovieView, and(eq(mediaMostPopular.mediaId, tmdbMovieView.id), eq(mediaMostPopular.type, 'movie')))
          .leftJoin(tmdbTvSeriesView, and(eq(mediaMostPopular.mediaId, tmdbTvSeriesView.id), eq(mediaMostPopular.type, 'tv_series')))
          .where(cursorWhereClause)
          .orderBy(...orderBy)
          .limit(per_page + 1),
        (!cursorData && include_total_count)
          ? tx.select({ count: sql<number>`cast(count(*) as int)` }).from(mediaMostPopular)
          : Promise.resolve(undefined),
      ]);

      const totalCount = totalCountResult ? totalCountResult[0].count : undefined;
      const hasNextPage = results.length > per_page;
      const paginatedResults = hasNextPage ? results.slice(0, per_page) : results;

      let nextCursor: string | null = null;
      if (hasNextPage) {
        const lastItem = paginatedResults[paginatedResults.length - 1].popular;
        nextCursor = encodeCursor<BaseCursor<string | number, number>>({
          value: lastItem.popularity,
          id: lastItem.mediaId,
        });
      }

      return plainToInstance(ListInfiniteMediasMostPopularDto, {
        data: paginatedResults.map((row) => ({
          type: row.popular.type,
          mediaId: row.popular.mediaId,
          popularity: row.popular.popularity,
          media: row.popular.type === 'movie' ? row.movie : row.tvSeries,
        })),
        meta: {
          next_cursor: nextCursor,
          per_page,
          total_results: totalCount,
        },
      }, { excludeExtraneousValues: true });
    });
  }
}