import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, gt, lt, or, sql, SQL } from 'drizzle-orm';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../../common/modules/drizzle/drizzle.module';
import { tmdbTvEpisode, tmdbTvSeasonView } from '@libs/db/schemas';
import { User } from '../../../auth/auth.service';
import { SupportedLocale } from '@libs/i18n';
import { BaseCursor, decodeCursor, encodeCursor } from '../../../../utils/cursor';
import { SortOrder } from '../../../../common/dto/sort.dto';
import { plainToInstance } from 'class-transformer';
import { 
  ListAllTvEpisodesQueryDto, 
  ListInfiniteTvEpisodesDto, 
  ListInfiniteTvEpisodesQueryDto, 
  ListPaginatedTvEpisodesDto, 
  ListPaginatedTvEpisodesQueryDto, 
  TvEpisodeDto, 
  TvEpisodeSortBy 
} from './tv-episodes.dto';

@Injectable()
export class TvEpisodesService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  private getListBaseQuery(sortBy: TvEpisodeSortBy, sortOrder: SortOrder) {
    const direction = sortOrder === SortOrder.ASC ? asc : desc;
    
    let sortColumn: SQL | any;
    switch (sortBy) {
      case TvEpisodeSortBy.AIR_DATE:
        sortColumn = tmdbTvEpisode.airDate;
        break;
      case TvEpisodeSortBy.EPISODE_NUMBER:
      default:
        sortColumn = tmdbTvEpisode.episodeNumber;
        break;
    }

    return { sortColumn, orderBy: [direction(sortColumn), direction(tmdbTvEpisode.id)] };
  }

  private mapResultsToDto(results: any[]) {
    return results.map(({ seasonUrl, ...episode }) => 
      plainToInstance(TvEpisodeDto, {
        ...episode,
        url: seasonUrl ? `${seasonUrl}/episode/${episode.episodeNumber}` : null,
      }, { excludeExtraneousValues: true })
    );
  }

  async listAll({
    tvSeriesId,
    seasonNumber,
    query,
    locale,
    currentUser,
  }: {
    tvSeriesId: number;
    seasonNumber: number;
    query: ListAllTvEpisodesQueryDto;
    locale: SupportedLocale;
    currentUser: User | null;
  }): Promise<TvEpisodeDto[]> {
    return await this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_language', ${locale}, true)`);
      if (currentUser) {
        await tx.execute(sql`SELECT set_config('app.current_user_id', ${currentUser.id}, true)`);
      }

      const { orderBy } = this.getListBaseQuery(query.sort_by, query.sort_order);

      const results = await tx
        .select({
          id: tmdbTvEpisode.id,
          tvSeasonId: tmdbTvEpisode.tvSeasonId,
          tvSeriesId: tmdbTvSeasonView.tvSeriesId,
          seasonNumber: tmdbTvSeasonView.seasonNumber,
          episodeNumber: tmdbTvEpisode.episodeNumber,
          name: tmdbTvEpisode.name,
          overview: tmdbTvEpisode.overview,
          airDate: tmdbTvEpisode.airDate,
          episodeType: tmdbTvEpisode.episodeType,
          runtime: tmdbTvEpisode.runtime,
          productionCode: tmdbTvEpisode.productionCode,
          stillPath: tmdbTvEpisode.stillPath,
          voteAverage: tmdbTvEpisode.voteAverage,
          voteCount: tmdbTvEpisode.voteCount,
          seasonUrl: tmdbTvSeasonView.url,
        })
        .from(tmdbTvEpisode)
        .innerJoin(tmdbTvSeasonView, eq(tmdbTvSeasonView.id, tmdbTvEpisode.tvSeasonId))
        .where(
          and(
            eq(tmdbTvSeasonView.tvSeriesId, tvSeriesId),
            eq(tmdbTvSeasonView.seasonNumber, seasonNumber)
          )
        )
        .orderBy(...orderBy);

      return this.mapResultsToDto(results);
    });
  }

  async listPaginated({
    tvSeriesId,
    seasonNumber,
    query,
    locale,
    currentUser,
  }: {
    tvSeriesId: number;
    seasonNumber: number;
    query: ListPaginatedTvEpisodesQueryDto;
    locale: SupportedLocale;
    currentUser: User | null;
  }): Promise<ListPaginatedTvEpisodesDto> {
    return await this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_language', ${locale}, true)`);
      if (currentUser) {
        await tx.execute(sql`SELECT set_config('app.current_user_id', ${currentUser.id}, true)`);
      }

      const { per_page, sort_order, sort_by, page } = query;
      const offset = (page - 1) * per_page;
      const { orderBy } = this.getListBaseQuery(sort_by, sort_order);

      const baseWhere = and(
        eq(tmdbTvSeasonView.tvSeriesId, tvSeriesId),
        eq(tmdbTvSeasonView.seasonNumber, seasonNumber)
      );

      const [results, totalCountResult] = await Promise.all([
        tx
          .select({
            id: tmdbTvEpisode.id,
            tvSeasonId: tmdbTvEpisode.tvSeasonId,
            tvSeriesId: tmdbTvSeasonView.tvSeriesId,
            seasonNumber: tmdbTvSeasonView.seasonNumber,
            episodeNumber: tmdbTvEpisode.episodeNumber,
            name: tmdbTvEpisode.name,
            overview: tmdbTvEpisode.overview,
            airDate: tmdbTvEpisode.airDate,
            episodeType: tmdbTvEpisode.episodeType,
            runtime: tmdbTvEpisode.runtime,
            productionCode: tmdbTvEpisode.productionCode,
            stillPath: tmdbTvEpisode.stillPath,
            voteAverage: tmdbTvEpisode.voteAverage,
            voteCount: tmdbTvEpisode.voteCount,
            seasonUrl: tmdbTvSeasonView.url,
          })
          .from(tmdbTvEpisode)
          .innerJoin(tmdbTvSeasonView, eq(tmdbTvSeasonView.id, tmdbTvEpisode.tvSeasonId))
          .where(baseWhere)
          .orderBy(...orderBy)
          .limit(per_page)
          .offset(offset),
        tx.select({ count: sql<number>`cast(count(*) as int)` })
          .from(tmdbTvEpisode)
          .innerJoin(tmdbTvSeasonView, eq(tmdbTvSeasonView.id, tmdbTvEpisode.tvSeasonId))
          .where(baseWhere),
      ]);

      const totalCount = totalCountResult[0].count;

      return plainToInstance(ListPaginatedTvEpisodesDto, {
        data: this.mapResultsToDto(results),
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
    seasonNumber,
    query,
    locale,
    currentUser,
  }: {
    tvSeriesId: number;
    seasonNumber: number;
    query: ListInfiniteTvEpisodesQueryDto;
    locale: SupportedLocale;
    currentUser: User | null;
  }): Promise<ListInfiniteTvEpisodesDto> {
    return await this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_language', ${locale}, true)`);
      if (currentUser) {
        await tx.execute(sql`SELECT set_config('app.current_user_id', ${currentUser.id}, true)`);
      }

      const { per_page, sort_order, sort_by, cursor, include_total_count } = query;
      const cursorData = cursor ? decodeCursor<BaseCursor<string | number, number>>(cursor) : null;
      const { sortColumn, orderBy } = this.getListBaseQuery(sort_by, sort_order);

      const baseWhere = and(
        eq(tmdbTvSeasonView.tvSeriesId, tvSeriesId),
        eq(tmdbTvSeasonView.seasonNumber, seasonNumber)
      );

      let cursorWhereClause: SQL | undefined;

      if (cursorData) {
        const operator = sort_order === SortOrder.ASC ? gt : lt;
        const cursorValue = sort_by === TvEpisodeSortBy.EPISODE_NUMBER ? Number(cursorData.value) : cursorData.value;
        
        cursorWhereClause = or(
          operator(sortColumn, cursorValue),
          and(
            eq(sortColumn, cursorValue),
            operator(tmdbTvEpisode.id, cursorData.id)
          )
        );
      }

      const fetchLimit = per_page + 1;

      const [results, totalCountResult] = await Promise.all([
        tx
          .select({
            id: tmdbTvEpisode.id,
            tvSeasonId: tmdbTvEpisode.tvSeasonId,
            tvSeriesId: tmdbTvSeasonView.tvSeriesId,
            seasonNumber: tmdbTvSeasonView.seasonNumber,
            episodeNumber: tmdbTvEpisode.episodeNumber,
            name: tmdbTvEpisode.name,
            overview: tmdbTvEpisode.overview,
            airDate: tmdbTvEpisode.airDate,
            episodeType: tmdbTvEpisode.episodeType,
            runtime: tmdbTvEpisode.runtime,
            productionCode: tmdbTvEpisode.productionCode,
            stillPath: tmdbTvEpisode.stillPath,
            voteAverage: tmdbTvEpisode.voteAverage,
            voteCount: tmdbTvEpisode.voteCount,
            seasonUrl: tmdbTvSeasonView.url,
          })
          .from(tmdbTvEpisode)
          .innerJoin(tmdbTvSeasonView, eq(tmdbTvSeasonView.id, tmdbTvEpisode.tvSeasonId))
          .where(and(baseWhere, cursorWhereClause))
          .orderBy(...orderBy)
          .limit(fetchLimit),
        (!cursorData && include_total_count)
          ? tx.select({ count: sql<number>`cast(count(*) as int)` })
              .from(tmdbTvEpisode)
              .innerJoin(tmdbTvSeasonView, eq(tmdbTvSeasonView.id, tmdbTvEpisode.tvSeasonId))
              .where(baseWhere)
          : Promise.resolve(undefined)
      ]);

      const totalCount = totalCountResult ? totalCountResult[0].count : undefined;
      const hasNextPage = results.length > per_page;
      const paginatedResults = hasNextPage ? results.slice(0, per_page) : results;

      let nextCursor: string | null = null;

      if (hasNextPage) {
        const lastItem = paginatedResults[paginatedResults.length - 1];
        nextCursor = encodeCursor<BaseCursor<string | number, number>>({
          value: sort_by === TvEpisodeSortBy.AIR_DATE ? (lastItem.airDate as string) : lastItem.episodeNumber,
          id: lastItem.id,
        });
      }

      return plainToInstance(ListInfiniteTvEpisodesDto, {
        data: this.mapResultsToDto(paginatedResults),
        meta: {
          next_cursor: nextCursor,
          per_page,
          total_results: totalCount,
        },
      }, { excludeExtraneousValues: true });
    });
  }
}