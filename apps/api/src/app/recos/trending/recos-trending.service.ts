import { Inject, Injectable, Logger } from '@nestjs/common';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle/drizzle.module';
import { Cron, CronExpression } from '@nestjs/schedule';
import { recosTrending, tmdbMovieView, tmdbTvSeriesView } from '@libs/db/schemas';
import { ListInfiniteRecosTrendingDto, ListInfiniteRecosTrendingQueryDto, ListPaginatedRecosTrendingDto, ListPaginatedRecosTrendingQueryDto, RecoTrendingSortBy } from './recos-trending.dto';
import { SortOrder } from '../../../common/dto/sort.dto';
import { and, asc, desc, eq, gt, lt, or, sql, SQL } from 'drizzle-orm';
import { MOVIE_SUMMARY_SELECT, TV_SERIES_SUMMARY_SELECT } from '@libs/db/selectors';
import { plainToInstance } from 'class-transformer';
import { BaseCursor, decodeCursor, encodeCursor } from '../../../utils/cursor';
import { SupportedLocale } from '@libs/i18n';

@Injectable()
export class RecosTrendingService {
  private readonly logger = new Logger(RecosTrendingService.name);

  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async refreshTrendingView() {
    this.logger.log('Starting refresh of recosTrending view...');
    try {
      await this.db.refreshMaterializedView(recosTrending);
      this.logger.log('Successfully refreshed recosTrending view.');
    } catch (error) {
      this.logger.error('Failed to refresh recosTrending view', error);
    }
  }

  private getListBaseQuery(sortBy: RecoTrendingSortBy, sortOrder: SortOrder) {
    const direction = sortOrder === SortOrder.ASC ? asc : desc;
    
    const orderBy = (() => {
      switch (sortBy) {
        case RecoTrendingSortBy.RECOMMENDATION_COUNT:
        default:
          return [direction(recosTrending.recommendationCount), direction(recosTrending.mediaId)];
      }
    })();

    return { orderBy };
  }

  async listPaginated({
    query,
    locale,
  }: {
    query: ListPaginatedRecosTrendingQueryDto;
    locale: SupportedLocale;
  }): Promise<ListPaginatedRecosTrendingDto> {
    return await this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_language', ${locale}, true)`);

      const { per_page, sort_order, sort_by, page } = query;
      const offset = (page - 1) * per_page;

      const { orderBy } = this.getListBaseQuery(sort_by, sort_order);

      const [results, totalCount] = await Promise.all([
        tx
          .select({
            reco: {
              mediaId: recosTrending.mediaId,
              type: recosTrending.type,
              recommendationCount: recosTrending.recommendationCount,
            },
            movie: MOVIE_SUMMARY_SELECT,
            tvSeries: TV_SERIES_SUMMARY_SELECT,
          })
          .from(recosTrending)
          .leftJoin(tmdbMovieView, and(eq(recosTrending.mediaId, tmdbMovieView.id), eq(recosTrending.type, 'movie')))
          .leftJoin(tmdbTvSeriesView, and(eq(recosTrending.mediaId, tmdbTvSeriesView.id), eq(recosTrending.type, 'tv_series')))
          .orderBy(...orderBy)
          .limit(per_page)
          .offset(offset),
        tx.$count(recosTrending),
      ]);

      return plainToInstance(ListPaginatedRecosTrendingDto, {
        data: results.map((row) => ({
          type: row.reco.type,
          mediaId: row.reco.mediaId,
          recommendationCount: row.reco.recommendationCount,
          media: row.reco.type === 'movie' ? row.movie : row.tvSeries,
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
    query: ListInfiniteRecosTrendingQueryDto;
    locale: SupportedLocale;
  }): Promise<ListInfiniteRecosTrendingDto> {
    return await this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_language', ${locale}, true)`);

      const { per_page, sort_order, sort_by, cursor, include_total_count } = query;

      const cursorData = cursor ? decodeCursor<BaseCursor<string | number, number>>(cursor) : null;
      const { orderBy } = this.getListBaseQuery(sort_by, sort_order);

      let cursorWhereClause: SQL | undefined;

      if (cursorData) {
        const operator = sort_order === SortOrder.ASC ? gt : lt;
        cursorWhereClause = or(
          operator(recosTrending.recommendationCount, Number(cursorData.value)),
          and(
            eq(recosTrending.recommendationCount, Number(cursorData.value)),
            operator(recosTrending.mediaId, cursorData.id)
          )
        );
      }

      const fetchLimit = per_page + 1;

      const [results, totalCountResult] = await Promise.all([
        tx
          .select({
            reco: {
              mediaId: recosTrending.mediaId,
              type: recosTrending.type,
              recommendationCount: recosTrending.recommendationCount,
            },
            movie: MOVIE_SUMMARY_SELECT,
            tvSeries: TV_SERIES_SUMMARY_SELECT,
          })
          .from(recosTrending)
          .leftJoin(tmdbMovieView, and(eq(recosTrending.mediaId, tmdbMovieView.id), eq(recosTrending.type, 'movie')))
          .leftJoin(tmdbTvSeriesView, and(eq(recosTrending.mediaId, tmdbTvSeriesView.id), eq(recosTrending.type, 'tv_series')))
          .where(cursorWhereClause)
          .orderBy(...orderBy)
          .limit(fetchLimit),
        (!cursorData && include_total_count)
          ? tx.select({ count: sql<number>`cast(count(*) as int)` }).from(recosTrending) // <-- tx
          : Promise.resolve(undefined)
      ]);

      const totalCount = totalCountResult ? totalCountResult[0].count : undefined;
      const hasNextPage = results.length > per_page;
      const paginatedResults = hasNextPage ? results.slice(0, per_page) : results;

      let nextCursor: string | null = null;

      if (hasNextPage) {
        const lastItem = paginatedResults[paginatedResults.length - 1].reco;
        nextCursor = encodeCursor<BaseCursor<string | number, number>>({
          value: lastItem.recommendationCount,
          id: lastItem.mediaId,
        });
      }

      return plainToInstance(ListInfiniteRecosTrendingDto, {
        data: paginatedResults.map((row) => ({
          type: row.reco.type,
          mediaId: row.reco.mediaId,
          recommendationCount: row.reco.recommendationCount,
          media: row.reco.type === 'movie' ? row.movie : row.tvSeries,
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
