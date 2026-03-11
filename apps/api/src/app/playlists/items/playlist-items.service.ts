import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle/drizzle.module';
import { playlist, playlistItem, tmdbMovieView, tmdbTvSeriesView } from '@libs/db/schemas';
import { and, asc, desc, eq, gt, inArray, lt, or, sql, SQL } from 'drizzle-orm';
import { 
  PlaylistItemWithMediaUnion, 
  ListAllPlaylistItemsQueryDto, 
  ListPaginatedPlaylistItemsQueryDto, 
  ListPaginatedPlaylistItemsDto, 
  ListInfinitePlaylistItemsQueryDto, 
  ListInfinitePlaylistItemsDto, 
  PlaylistItemSortBy,
  PlaylistItemDto,
  PlaylistItemsDeleteDto
} from './playlist-items.dto'; 
import { BaseCursor, decodeCursor, encodeCursor } from '../../../utils/cursor';
import { MOVIE_COMPACT_SELECT, TV_SERIES_COMPACT_SELECT } from '@libs/db/selectors';
import { SupportedLocale } from '@libs/i18n';
import { SortOrder } from '../../../common/dto/sort.dto';
import { DbTransaction } from '@libs/db';
import { plainToInstance } from 'class-transformer';
import { WorkerClient } from '@shared/worker';

@Injectable()
export class PlaylistItemsService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
    private readonly workerClient: WorkerClient,
  ) {}

  private async getListBaseQuery(
    tx: DbTransaction,
    playlistId: number,
    locale: SupportedLocale,
    sortBy: PlaylistItemSortBy,
    sortOrder: SortOrder,
  ) {
    await tx.execute(sql`SELECT set_config('app.current_language', ${locale}, true)`);

    const direction = sortOrder === SortOrder.ASC ? asc : desc;
    
    const orderBy = (() => {
      switch (sortBy) {
        case PlaylistItemSortBy.CREATED_AT:
          return [direction(playlistItem.createdAt), direction(playlistItem.id)];
        case PlaylistItemSortBy.RANK:
        default:
          return [direction(playlistItem.rank), direction(playlistItem.id)];
      }
    })();

    const whereClause = eq(playlistItem.playlistId, playlistId);

    return { whereClause, orderBy };
  }

  async listAll({
    playlistId,
    query,
    locale,
  }: {
    playlistId: number;
    query: ListAllPlaylistItemsQueryDto;
    locale: SupportedLocale;
  }): Promise<PlaylistItemWithMediaUnion[]> {
    return await this.db.transaction(async (tx) => {
      const { sort_by, sort_order } = query;
      const { whereClause, orderBy } = await this.getListBaseQuery(tx, playlistId, locale, sort_by, sort_order);

      const results = await tx.select({
          item: playlistItem,
          movie: MOVIE_COMPACT_SELECT,
          tvSeries: TV_SERIES_COMPACT_SELECT,
        })
        .from(playlistItem)
        .innerJoin(playlist, eq(playlist.id, playlistItem.playlistId))
        .where(whereClause)
        .leftJoin(tmdbMovieView, eq(playlistItem.movieId, tmdbMovieView.id))
        .leftJoin(tmdbTvSeriesView, eq(playlistItem.tvSeriesId, tmdbTvSeriesView.id))
        .orderBy(...orderBy);

      return results.map((row): PlaylistItemWithMediaUnion => {
        const { movieId, tvSeriesId, ...baseItem } = row.item;
        if (baseItem.type === 'movie') {
          return { ...baseItem, type: 'movie', mediaId: movieId, media: row.movie };
        }
        return { ...baseItem, type: 'tv_series', mediaId: tvSeriesId, media: row.tvSeries };
      });
    });
  }

  async listPaginated({
    playlistId,
    query,
    locale,
  }: {
    playlistId: number;
    query: ListPaginatedPlaylistItemsQueryDto;
    locale: SupportedLocale;
  }): Promise<ListPaginatedPlaylistItemsDto> {
    return await this.db.transaction(async (tx) => {
      const { per_page, page, sort_by, sort_order } = query;
      const offset = (page - 1) * per_page;

      const { whereClause, orderBy } = await this.getListBaseQuery(tx, playlistId, locale, sort_by, sort_order);

      const paginatedItemsSubquery = tx.select({ id: playlistItem.id })
        .from(playlistItem)
        .innerJoin(playlist, eq(playlist.id, playlistItem.playlistId))
        .where(whereClause)
        .orderBy(...orderBy)
        .limit(per_page)
        .offset(offset)
        .as('paginated_items');

      const [results, totalCountResult] = await Promise.all([
        tx.select({
            item: playlistItem,
            movie: MOVIE_COMPACT_SELECT,
            tvSeries: TV_SERIES_COMPACT_SELECT,
          })
          .from(paginatedItemsSubquery)
          .innerJoin(playlistItem, eq(playlistItem.id, paginatedItemsSubquery.id))
          .leftJoin(tmdbMovieView, eq(playlistItem.movieId, tmdbMovieView.id))
          .leftJoin(tmdbTvSeriesView, eq(playlistItem.tvSeriesId, tmdbTvSeriesView.id))
          .orderBy(...orderBy),
        tx.select({ count: sql<number>`cast(count(*) as int)` })
          .from(playlistItem)
          .innerJoin(playlist, eq(playlist.id, playlistItem.playlistId))
          .where(whereClause)
      ]);

      const totalCount = Number(totalCountResult[0]?.count || 0);

      return plainToInstance(ListPaginatedPlaylistItemsDto, {
        data: results.map((row): ListPaginatedPlaylistItemsDto['data'][number] => {
          const { movieId, tvSeriesId, ...baseItem } = row.item;
          if (baseItem.type === 'movie') {
            return { ...baseItem, type: 'movie', mediaId: movieId, media: row.movie };
          }
          return { ...baseItem, type: 'tv_series', mediaId: tvSeriesId, media: row.tvSeries };
        }),
        meta: {
          total_results: totalCount,
          total_pages: Math.ceil(totalCount / per_page),
          current_page: page,
          per_page,
        },
      });
    });
  }

  async listInfinite({
    playlistId,
    query,
    locale,
  }: {
    playlistId: number;
    query: ListInfinitePlaylistItemsQueryDto;
    locale: SupportedLocale;
  }): Promise<ListInfinitePlaylistItemsDto> {
    return await this.db.transaction(async (tx) => {
      const { per_page, sort_order, sort_by, cursor } = query;

      const cursorData = cursor ? decodeCursor<BaseCursor<string, number>>(cursor) : null;
      const { whereClause: baseWhereClause, orderBy } = await this.getListBaseQuery(tx, playlistId, locale, sort_by, sort_order);

      let cursorWhereClause: SQL | undefined;

      if (cursorData) {
        const operator = sort_order === SortOrder.ASC ? gt : lt;

        switch (sort_by) {
          case PlaylistItemSortBy.CREATED_AT:
            cursorWhereClause = or(
              operator(playlistItem.createdAt, cursorData.value),
              and(eq(playlistItem.createdAt, cursorData.value), operator(playlistItem.id, cursorData.id))
            );
            break;
          case PlaylistItemSortBy.RANK:
          default:
            cursorWhereClause = or(
              operator(playlistItem.rank, cursorData.value),
              and(eq(playlistItem.rank, cursorData.value), operator(playlistItem.id, cursorData.id))
            );
            break;
        }
      }

      const finalWhereClause = cursorWhereClause 
        ? and(baseWhereClause, cursorWhereClause) 
        : baseWhereClause;

      const fetchLimit = per_page + 1;

      const paginatedItemsSubquery = tx.select({ id: playlistItem.id })
        .from(playlistItem)
        .innerJoin(playlist, eq(playlist.id, playlistItem.playlistId))
        .where(finalWhereClause)
        .orderBy(...orderBy)
        .limit(fetchLimit)
        .as('paginated_items');

      const results = await tx.select({
          item: playlistItem,
          movie: MOVIE_COMPACT_SELECT,
          tvSeries: TV_SERIES_COMPACT_SELECT,
        })
        .from(paginatedItemsSubquery)
        .innerJoin(playlistItem, eq(playlistItem.id, paginatedItemsSubquery.id))
        .leftJoin(tmdbMovieView, eq(playlistItem.movieId, tmdbMovieView.id))
        .leftJoin(tmdbTvSeriesView, eq(playlistItem.tvSeriesId, tmdbTvSeriesView.id))
        .orderBy(...orderBy);

      const hasNextPage = results.length > per_page;
      const paginatedResults = hasNextPage ? results.slice(0, per_page) : results;

      let nextCursor: string | null = null;

      if (hasNextPage) {
        const lastItem = paginatedResults[paginatedResults.length - 1].item;
        let cursorValue: string | number | null = null;

        switch (sort_by) {
          case PlaylistItemSortBy.CREATED_AT:
            cursorValue = lastItem.createdAt;
            break;
          case PlaylistItemSortBy.RANK:
          default:
            cursorValue = lastItem.rank;
            break;
        }

        if (cursorValue !== null) {
          nextCursor = encodeCursor<BaseCursor<string, number>>({
            value: cursorValue,
            id: lastItem.id,
          });
        }
      }

      return plainToInstance(ListInfinitePlaylistItemsDto, {
        data: paginatedResults.map((row): ListInfinitePlaylistItemsDto['data'][number] => {
          const { movieId, tvSeriesId, ...baseItem } = row.item;
          if (baseItem.type === 'movie') {
            return { ...baseItem, type: 'movie', mediaId: movieId, media: row.movie };
          }
          return { ...baseItem, type: 'tv_series', mediaId: tvSeriesId, media: row.tvSeries };
        }),
        meta: {
          next_cursor: nextCursor,
          per_page,
        }
      });
    });
  }

  async delete({
    playlistId,
    dto,
  }: {
    playlistId: number;
    dto: PlaylistItemsDeleteDto;
  }): Promise<PlaylistItemDto[]> {
    const uniqueItemIds = [...new Set(dto.itemIds)];
    if (uniqueItemIds.length === 0) return [];

    const deletedItems = await this.db.delete(playlistItem)
      .where(
        and(
          eq(playlistItem.playlistId, playlistId),
          inArray(playlistItem.id, uniqueItemIds)
        )
      )
      .returning();
    
    if (deletedItems.length > 0) {
      await this.workerClient.emit('counters:update-playlist-items', {
        playlistId,
        action: 'decrement',
        amount: deletedItems.length,
      });
    }

    return plainToInstance(PlaylistItemDto, deletedItems.map(({ movieId, tvSeriesId, ...item }) => ({
      ...item,
      mediaId: item.type === 'movie' ? movieId : tvSeriesId,
    })));
  }
}