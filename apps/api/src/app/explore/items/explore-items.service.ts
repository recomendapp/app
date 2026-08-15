import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle/drizzle.module';
import { exploreItem, tmdbMovieView, tmdbTvSeriesView } from '@libs/db/schemas';
import { and, asc, desc, eq, gt, lt, sql, SQL } from 'drizzle-orm';
import {
  ExploreItemWithMediaUnion,
  ListAllExploreItemsQueryDto,
  ListPaginatedExploreItemsQueryDto,
  ListPaginatedExploreItemsDto,
  ListInfiniteExploreItemsQueryDto,
  ListInfiniteExploreItemsDto,
} from './explore-items.dto';
import { BaseCursor, decodeCursor, encodeCursor } from '../../../utils/cursor';
import { MOVIE_COMPACT_SELECT, TV_SERIES_COMPACT_SELECT } from '@libs/db/selectors';
import { SupportedLocale } from '@libs/i18n';
import { SortOrder } from '../../../common/dto/sort.dto';
import { plainToInstance } from 'class-transformer';
import { ExploreService } from '../explore.service';

@Injectable()
export class ExploreItemsService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
    private readonly exploreService: ExploreService,
  ) {}

  private getWhereClause(
    exploreId: number,
    type: ListAllExploreItemsQueryDto['type'],
  ): SQL | undefined {
    return type
      ? and(eq(exploreItem.exploreId, exploreId), eq(exploreItem.type, type))
      : eq(exploreItem.exploreId, exploreId);
  }

  async listAll({
    identifier,
    query,
    locale,
  }: {
    identifier: string;
    query: ListAllExploreItemsQueryDto;
    locale: SupportedLocale;
  }): Promise<ExploreItemWithMediaUnion[]> {
    const exploreId = await this.exploreService.resolveId(identifier);

    return await this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_language', ${locale}, true)`);

      const { type, sort_order } = query;
      const direction = sort_order === SortOrder.ASC ? asc : desc;
      const whereClause = this.getWhereClause(exploreId, type);

      const results = await tx
        .select({
          item: exploreItem,
          movie: MOVIE_COMPACT_SELECT,
          tvSeries: TV_SERIES_COMPACT_SELECT,
        })
        .from(exploreItem)
        .where(whereClause)
        .leftJoin(tmdbMovieView, eq(exploreItem.movieId, tmdbMovieView.id))
        .leftJoin(tmdbTvSeriesView, eq(exploreItem.tvSeriesId, tmdbTvSeriesView.id))
        .orderBy(direction(exploreItem.id));

      return results.map((row): ExploreItemWithMediaUnion => {
        const { movieId, tvSeriesId, location, ...baseItem } = row.item;
        const mappedLocation = { lat: location.y, lng: location.x };
        if (baseItem.type === 'movie') {
          return {
            ...baseItem,
            location: mappedLocation,
            type: 'movie',
            mediaId: movieId,
            media: row.movie,
          };
        }
        return {
          ...baseItem,
          location: mappedLocation,
          type: 'tv_series',
          mediaId: tvSeriesId,
          media: row.tvSeries,
        };
      });
    });
  }

  async listPaginated({
    identifier,
    query,
    locale,
  }: {
    identifier: string;
    query: ListPaginatedExploreItemsQueryDto;
    locale: SupportedLocale;
  }): Promise<ListPaginatedExploreItemsDto> {
    const exploreId = await this.exploreService.resolveId(identifier);

    return await this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_language', ${locale}, true)`);

      const { per_page, page, type, sort_order } = query;
      const offset = (page - 1) * per_page;
      const direction = sort_order === SortOrder.ASC ? asc : desc;
      const whereClause = this.getWhereClause(exploreId, type);

      const paginatedItemsSubquery = tx
        .select({ id: exploreItem.id })
        .from(exploreItem)
        .where(whereClause)
        .orderBy(direction(exploreItem.id))
        .limit(per_page)
        .offset(offset)
        .as('paginated_items');

      const [results, totalCountResult] = await Promise.all([
        tx
          .select({
            item: exploreItem,
            movie: MOVIE_COMPACT_SELECT,
            tvSeries: TV_SERIES_COMPACT_SELECT,
          })
          .from(paginatedItemsSubquery)
          .innerJoin(exploreItem, eq(exploreItem.id, paginatedItemsSubquery.id))
          .leftJoin(tmdbMovieView, eq(exploreItem.movieId, tmdbMovieView.id))
          .leftJoin(tmdbTvSeriesView, eq(exploreItem.tvSeriesId, tmdbTvSeriesView.id))
          .orderBy(direction(exploreItem.id)),
        tx
          .select({ count: sql<number>`cast(count(*) as int)` })
          .from(exploreItem)
          .where(whereClause),
      ]);

      const totalCount = Number(totalCountResult[0]?.count || 0);

      return plainToInstance(
        ListPaginatedExploreItemsDto,
        {
          data: results.map((row): ExploreItemWithMediaUnion => {
            const { movieId, tvSeriesId, location, ...baseItem } = row.item;
            const mappedLocation = { lat: location.y, lng: location.x };
            if (baseItem.type === 'movie') {
              return {
                ...baseItem,
                location: mappedLocation,
                type: 'movie',
                mediaId: movieId,
                media: row.movie,
              };
            }
            return {
              ...baseItem,
              location: mappedLocation,
              type: 'tv_series',
              mediaId: tvSeriesId,
              media: row.tvSeries,
            };
          }),
          meta: {
            total_results: totalCount,
            total_pages: Math.ceil(totalCount / per_page),
            current_page: page,
            per_page,
          },
        },
        { excludeExtraneousValues: true },
      );
    });
  }

  async listInfinite({
    identifier,
    query,
    locale,
  }: {
    identifier: string;
    query: ListInfiniteExploreItemsQueryDto;
    locale: SupportedLocale;
  }): Promise<ListInfiniteExploreItemsDto> {
    const exploreId = await this.exploreService.resolveId(identifier);

    return await this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_language', ${locale}, true)`);

      const { per_page, type, sort_order, cursor, include_total_count } = query;
      const direction = sort_order === SortOrder.ASC ? asc : desc;
      const operator = sort_order === SortOrder.ASC ? gt : lt;

      const cursorData = cursor ? decodeCursor<BaseCursor<number, number>>(cursor) : null;
      const baseWhereClause = this.getWhereClause(exploreId, type);

      const finalWhereClause = cursorData
        ? and(baseWhereClause, operator(exploreItem.id, cursorData.id))
        : baseWhereClause;

      const fetchLimit = per_page + 1;

      const paginatedItemsSubquery = tx
        .select({ id: exploreItem.id })
        .from(exploreItem)
        .where(finalWhereClause)
        .orderBy(direction(exploreItem.id))
        .limit(fetchLimit)
        .as('paginated_items');

      const [results, totalCountResult] = await Promise.all([
        tx
          .select({
            item: exploreItem,
            movie: MOVIE_COMPACT_SELECT,
            tvSeries: TV_SERIES_COMPACT_SELECT,
          })
          .from(paginatedItemsSubquery)
          .innerJoin(exploreItem, eq(exploreItem.id, paginatedItemsSubquery.id))
          .leftJoin(tmdbMovieView, eq(exploreItem.movieId, tmdbMovieView.id))
          .leftJoin(tmdbTvSeriesView, eq(exploreItem.tvSeriesId, tmdbTvSeriesView.id))
          .orderBy(direction(exploreItem.id)),
        !cursorData && include_total_count
          ? tx
              .select({ count: sql<number>`cast(count(*) as int)` })
              .from(exploreItem)
              .where(baseWhereClause)
          : Promise.resolve(undefined),
      ]);

      const hasNextPage = results.length > per_page;
      const paginatedResults = hasNextPage ? results.slice(0, per_page) : results;

      let nextCursor: string | null = null;
      if (hasNextPage) {
        const lastItem = paginatedResults[paginatedResults.length - 1].item;
        nextCursor = encodeCursor<BaseCursor<number, number>>({
          value: lastItem.id,
          id: lastItem.id,
        });
      }

      return plainToInstance(
        ListInfiniteExploreItemsDto,
        {
          data: paginatedResults.map((row): ExploreItemWithMediaUnion => {
            const { movieId, tvSeriesId, location, ...baseItem } = row.item;
            const mappedLocation = { lat: location.y, lng: location.x };
            if (baseItem.type === 'movie') {
              return {
                ...baseItem,
                location: mappedLocation,
                type: 'movie',
                mediaId: movieId,
                media: row.movie,
              };
            }
            return {
              ...baseItem,
              location: mappedLocation,
              type: 'tv_series',
              mediaId: tvSeriesId,
              media: row.tvSeries,
            };
          }),
          meta: {
            next_cursor: nextCursor,
            per_page,
            total_results: totalCountResult ? totalCountResult[0].count : undefined,
          },
        },
        { excludeExtraneousValues: true },
      );
    });
  }
}
