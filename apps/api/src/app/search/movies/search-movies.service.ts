import { Inject, Injectable } from '@nestjs/common';
import { Client as TypesenseClient } from 'typesense';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle/drizzle.module';
import { User } from '../../auth/auth.service';
import { TYPESENSE_CLIENT } from '../../../common/modules/typesense/typesense.module';
import { 
  BaseSearchMoviesQueryDto, 
  ListInfiniteSearchMoviesQueryDto, 
  ListPaginatedSearchMoviesQueryDto 
} from './search-movies.dto';
import { 
  ListInfiniteMoviesDto, 
  ListPaginatedMoviesDto, 
  MovieCompactDto 
} from '../../movies/dto/movies.dto';
import { decodeCursor, encodeCursor } from '../../../utils/cursor';
import { inArray, sql } from 'drizzle-orm';
import { tmdbMovieView } from '@libs/db/schemas';
import { SearchParams } from 'typesense/lib/Typesense/Documents';
import { SupportedLocale } from '@libs/i18n';
import { MOVIE_COMPACT_SELECT } from '@libs/db/selectors';
import { DbTransaction } from '@libs/db';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class SearchMoviesService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
    @Inject(TYPESENSE_CLIENT) private readonly typesenseClient: TypesenseClient,
  ) {}

  private buildTypesenseParams(page: number, per_page: number, dto: BaseSearchMoviesQueryDto): SearchParams<{ id: string }> {
    const {
      q,
      genre_ids,
      runtime_min,
      runtime_max,
      release_date_min,
      release_date_max,
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

    // Runtime
    if (runtime_min !== undefined && runtime_max !== undefined) {
      filters.push(`runtime:[${runtime_min}..${runtime_max}]`);
    } else if (runtime_min !== undefined) {
      filters.push(`runtime:>=${runtime_min}`);
    } else if (runtime_max !== undefined) {
      filters.push(`runtime:<=${runtime_max}`);
    }

    // Release Date
    if (release_date_min && release_date_max) {
      const minDate = Math.floor(new Date(release_date_min).getTime() / 1000);
      const maxDate = Math.floor(new Date(release_date_max).getTime() / 1000);
      filters.push(`release_date:[${minDate}..${maxDate}]`);
    } else if (release_date_min) {
      const minDate = Math.floor(new Date(release_date_min).getTime() / 1000);
      filters.push(`release_date:>=${minDate}`);
    } else if (release_date_max) {
      const maxDate = Math.floor(new Date(release_date_max).getTime() / 1000);
      filters.push(`release_date:<=${maxDate}`);
    }

    const searchParameters: SearchParams<{ id: string }> = {
      q,
      query_by: 'original_title,titles',
      page,
      per_page,
      sort_by: '_text_match(buckets: 10):desc,popularity:desc',
    };

    if (filters.length > 0) {
      searchParameters.filter_by = filters.join(' && ');
    }

    return searchParameters;
  }

  public async hydrateMovies(
    tx: DbTransaction, 
    ids: string[]
  ): Promise<MovieCompactDto[]> {
    if (ids.length === 0) return [];

    const numericIds = ids.map(Number);

    const dbMovies = await tx
      .select(MOVIE_COMPACT_SELECT)
      .from(tmdbMovieView)
      .where(inArray(tmdbMovieView.id, numericIds));

    const movieMap = new Map(dbMovies.map((m) => [String(m.id), m]));
    
    return ids
        .map((id) => movieMap.get(id))
        .filter((movie): movie is MovieCompactDto => Boolean(movie));
  }

  async listPaginated({
    currentUser,
    locale,
    dto,
  }: {
    currentUser: User | null;
    locale: SupportedLocale;
    dto: ListPaginatedSearchMoviesQueryDto;
  }): Promise<ListPaginatedMoviesDto> {
    const { page, per_page } = dto;

    const params = this.buildTypesenseParams(page, per_page, dto);
    const typesenseResult = await this.typesenseClient
      .collections<{ id: string }>('movies')
      .documents()
      .search(params);
      
    const movieIds = typesenseResult.hits?.map((hit) => hit.document.id) || [];
    
    return await this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_language', ${locale}, true)`);
      if (currentUser) {
        await tx.execute(sql`SELECT set_config('app.current_user_id', ${currentUser.id}, true)`);
      }

      const hydratedMovies = await this.hydrateMovies(tx, movieIds);

      return plainToInstance(ListPaginatedMoviesDto, {
        data: hydratedMovies,
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
    dto: ListInfiniteSearchMoviesQueryDto;
  }): Promise<ListInfiniteMoviesDto> {
    const { cursor, per_page, include_total_count } = dto;
    
    const cursorData = cursor ? decodeCursor<{ page: number }>(cursor) : { page: 1 };
    const page = cursorData.page;

    const params = this.buildTypesenseParams(page, per_page, dto);
    const typesenseResult = await this.typesenseClient
      .collections<{ id: string }>('movies')
      .documents()
      .search(params);

    const movieIds = typesenseResult.hits?.map((hit) => hit.document.id) || [];
    
    return await this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_language', ${locale}, true)`);
      if (currentUser) {
        await tx.execute(sql`SELECT set_config('app.current_user_id', ${currentUser.id}, true)`);
      }

      const hydratedMovies = await this.hydrateMovies(tx, movieIds);

      const hasNextPage = page * per_page < typesenseResult.found;
      const nextCursor = hasNextPage 
          ? encodeCursor<{ page: number }>({ page: page + 1 }) 
          : null;

      return plainToInstance(ListInfiniteMoviesDto, {
        data: hydratedMovies,
        meta: {
          next_cursor: nextCursor,
          per_page,
          total_results: include_total_count ? typesenseResult.found : undefined,
        },
      }, { excludeExtraneousValues: true });
    });
  }
}