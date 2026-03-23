import { Inject, Injectable } from '@nestjs/common';
import { Client as TypesenseClient } from 'typesense';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle/drizzle.module';
import { User } from '../../auth/auth.service';
import { TYPESENSE_CLIENT } from '../../../common/modules/typesense/typesense.module';
import { SupportedLocale } from '@libs/i18n';
import { 
  BaseSearchTvSeriesQueryDto, 
  ListInfiniteSearchTvSeriesQueryDto, 
  ListPaginatedSearchTvSeriesQueryDto 
} from './search-tv-series.dto';
import { 
  ListInfiniteTvSeriesDto, 
  ListPaginatedTvSeriesDto,
  TvSeriesCompactDto 
} from '../../tv-series/dto/tv-series.dto';
import { decodeCursor, encodeCursor } from '../../../utils/cursor';
import { inArray, sql } from 'drizzle-orm';
import { tmdbTvSeriesView } from '@libs/db/schemas';
import { SearchParams } from 'typesense/lib/Typesense/Documents';
import { DbTransaction } from '@libs/db';
import { TV_SERIES_COMPACT_SELECT } from '@libs/db/selectors';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class SearchTvSeriesService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
    @Inject(TYPESENSE_CLIENT) private readonly typesenseClient: TypesenseClient,
  ) {}

  private buildTypesenseParams(
    page: number, 
    per_page: number, 
    dto: BaseSearchTvSeriesQueryDto
  ): SearchParams<{ id: string }> {
    const {
      q,
      genre_ids,
      number_of_seasons_min,
      number_of_seasons_max,
      number_of_episodes_min,
      number_of_episodes_max,
      first_air_date_min,
      first_air_date_max,
    } = dto;

    const filters: string[] = [];

    // Genre
    if (genre_ids) {
      const genres = genre_ids
        .split(',')
        .map((id) => parseInt(id, 10))
        .filter((id) => !isNaN(id));
      if (genres.length > 0) {
        filters.push(`genre_ids:[${genres.join(',')}]`);
      }
    }

    // Number of seasons
    if (number_of_seasons_min !== undefined && number_of_seasons_max !== undefined) {
      filters.push(`number_of_seasons:[${number_of_seasons_min}..${number_of_seasons_max}]`);
    } else if (number_of_seasons_min !== undefined) {
      filters.push(`number_of_seasons:>=${number_of_seasons_min}`);
    } else if (number_of_seasons_max !== undefined) {
      filters.push(`number_of_seasons:<=${number_of_seasons_max}`);
    }

    // Number of episodes
    if (number_of_episodes_min !== undefined && number_of_episodes_max !== undefined) {
      filters.push(`number_of_episodes:[${number_of_episodes_min}..${number_of_episodes_max}]`);
    } else if (number_of_episodes_min !== undefined) {
      filters.push(`number_of_episodes:>=${number_of_episodes_min}`);
    } else if (number_of_episodes_max !== undefined) {
      filters.push(`number_of_episodes:<=${number_of_episodes_max}`);
    }

    // First air date
    if (first_air_date_min && first_air_date_max) {
      const minDate = Math.floor(new Date(first_air_date_min).getTime() / 1000);
      const maxDate = Math.floor(new Date(first_air_date_max).getTime() / 1000);
      filters.push(`first_air_date:[${minDate}..${maxDate}]`);
    } else if (first_air_date_min) {
      const minDate = Math.floor(new Date(first_air_date_min).getTime() / 1000);
      filters.push(`first_air_date:>=${minDate}`);
    } else if (first_air_date_max) {
      const maxDate = Math.floor(new Date(first_air_date_max).getTime() / 1000);
      filters.push(`first_air_date:<=${maxDate}`);
    }

    const searchParameters: SearchParams<{ id: string }> = {
      q,
      query_by: 'original_name,names', 
      page,
      per_page,
      sort_by: '_text_match(buckets: 10):desc,popularity:desc',
    };

    if (filters.length > 0) {
      searchParameters.filter_by = filters.join(' && ');
    }

    return searchParameters;
  }

  public async hydrateTvSeries(
    tx: DbTransaction, 
    ids: string[]
  ): Promise<TvSeriesCompactDto[]> {
    if (ids.length === 0) return [];

    const numericIds = ids.map(Number);

    const dbTvSeries = await tx
      .select(TV_SERIES_COMPACT_SELECT)
      .from(tmdbTvSeriesView)
      .where(inArray(tmdbTvSeriesView.id, numericIds));

    const tvSeriesMap = new Map(dbTvSeries.map((s) => [String(s.id), s]));
    
    return ids
        .map((id) => tvSeriesMap.get(id))
        .filter((series): series is TvSeriesCompactDto => Boolean(series));
  }

  async listPaginated({
    currentUser,
    locale,
    dto,
  }: {
    currentUser: User | null;
    locale: SupportedLocale;
    dto: ListPaginatedSearchTvSeriesQueryDto;
  }): Promise<ListPaginatedTvSeriesDto> {
    const { page, per_page } = dto;

    const params = this.buildTypesenseParams(page, per_page, dto);
    
    const typesenseResult = await this.typesenseClient
      .collections<{ id: string }>('tv_series') 
      .documents()
      .search(params);
      
    const seriesIds = typesenseResult.hits?.map((hit) => hit.document.id) || [];
    
    return await this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_language', ${locale}, true)`);
      if (currentUser) {
        await tx.execute(sql`SELECT set_config('app.current_user_id', ${currentUser.id}, true)`);
      }

      const hydratedSeries = await this.hydrateTvSeries(tx, seriesIds);

      return plainToInstance(ListPaginatedTvSeriesDto, {
        data: hydratedSeries,
        meta: {
          total_results: typesenseResult.found,
          total_pages: Math.ceil(typesenseResult.found / per_page),
          current_page: page,
          per_page: per_page,
        },
      }, { excludeExtraneousValues: true });
    });
  }

  async listInfinite({
    currentUser,
    locale,
    dto,
  }: {
    currentUser: User | null;
    locale: SupportedLocale;
    dto: ListInfiniteSearchTvSeriesQueryDto;
  }): Promise<ListInfiniteTvSeriesDto> {
    const { cursor, per_page, include_total_count } = dto;
    
    const cursorData = cursor ? decodeCursor<{ page: number }>(cursor) : { page: 1 };
    const page = cursorData.page;

    const params = this.buildTypesenseParams(page, per_page, dto);
    
    const typesenseResult = await this.typesenseClient
      .collections<{ id: string }>('tv_series')
      .documents()
      .search(params);

    const seriesIds = typesenseResult.hits?.map((hit) => hit.document.id) || [];
    
    return await this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_language', ${locale}, true)`);
      if (currentUser) {
        await tx.execute(sql`SELECT set_config('app.current_user_id', ${currentUser.id}, true)`);
      }

      const hydratedSeries = await this.hydrateTvSeries(tx, seriesIds);

      const hasNextPage = page * per_page < typesenseResult.found;
      const nextCursor = hasNextPage 
          ? encodeCursor<{ page: number }>({ page: page + 1 }) 
          : null;

      return plainToInstance(ListInfiniteTvSeriesDto, {
        data: hydratedSeries,
        meta: {
          next_cursor: nextCursor,
          per_page,
          total_results: include_total_count ? typesenseResult.found : undefined,
        },
      }, { excludeExtraneousValues: true });
    });
  }
}