import { Inject, Injectable } from '@nestjs/common';
import { TypedSupabaseClient } from 'src/common/supabase/typed-supabase-client';
import { TYPESENSE_CLIENT } from 'src/common/typesense/typesense.module';
import { Client as TypesenseClient } from 'typesense';
import { SearchMoviesResponseDto } from './dto/search-movies-response.dto';
import { SearchMoviesQueryDto } from './dto/search-movies-query.dto';
import { MovieDto } from 'src/common/dto/movie.dto';

@Injectable()
export class MoviesSearchService {
  constructor(
    private readonly supabaseClient: TypedSupabaseClient,
    @Inject(TYPESENSE_CLIENT) private readonly typesenseClient: TypesenseClient,
  ) {}

  async search({
    q: query,
    page = 1,
    per_page = 10,
    sort_by = 'popularity',
    genre_ids,
    runtime_min,
    runtime_max,
    release_date_min,
    release_date_max,
  }: SearchMoviesQueryDto): Promise<SearchMoviesResponseDto> {
    const sortOrder = `${sort_by}:desc`;

    const searchParameters = {
      q: query,
      query_by: 'original_title,titles',
      page: page,
      per_page: per_page,
      sort_by: `_text_match(buckets: 10):desc,${sortOrder}`,
      filter_by: '',
    };

    const filters: string[] = [];

    // Genre
    if (genre_ids && genre_ids.length > 0) {
      const genres = genre_ids
        .split(',')
        .map((id) => parseInt(id, 10))
        .filter((id) => !isNaN(id));
      if (genres.length > 0) {
        filters.push(`genre_ids:[${genres.join(',')}]`);
      }
    }

    // Runtime
    if (runtime_min && runtime_max) {
      filters.push(`runtime:[${runtime_min}..${runtime_max}]`);
    } else if (runtime_min) {
      filters.push(`runtime:>=${runtime_min}`);
    } else if (runtime_max) {
      filters.push(`runtime:<=${runtime_max}`);
    }

    // Release Date
    if (release_date_min && release_date_max) {
      const minDate = new Date(release_date_min).getTime() / 1000;
      const maxDate = new Date(release_date_max).getTime() / 1000;
      filters.push(`release_date:[${minDate}..${maxDate}]`);
    } else if (release_date_min) {
      const minDate = new Date(release_date_min).getTime() / 1000;
      filters.push(`release_date:>=${minDate}`);
    } else if (release_date_max) {
      const maxDate = new Date(release_date_max).getTime() / 1000;
      filters.push(`release_date:<=${maxDate}`);
    }

    if (filters.length > 0) {
      searchParameters.filter_by = filters.join(' && ');
    }

    const typesenseResult = await this.typesenseClient
      .collections<{ id: string }>('movies')
      .documents()
      .search(searchParameters);

    const movieIds = typesenseResult.hits?.map((hit) => hit.document.id) || [];

    if (!movieIds || movieIds.length === 0) {
      return {
        data: [],
        pagination: {
          total_results: 0,
          total_pages: 0,
          current_page: page,
          per_page: per_page,
        },
      };
    }

    const hydratedMovies = await this.hydrateMovies(
      movieIds.map((id) => parseInt(id, 10)),
    );

    const movieMap = new Map(hydratedMovies.map((m) => [String(m.id), m]));
    const sortedMovies = movieIds
      .map((id) => movieMap.get(id))
      .filter(Boolean) as MovieDto[];

    return {
      data: sortedMovies,
      pagination: {
        total_results: typesenseResult.found,
        total_pages: Math.ceil(typesenseResult.found / per_page),
        current_page: page,
        per_page: per_page,
      },
    };
  }

  private async hydrateMovies(ids: number[]): Promise<MovieDto[]> {
    if (ids.length === 0) return [];

    const { data, error } = await this.supabaseClient
      .from('media_movie')
      .select('*')
      .in('id', ids);

    if (error) throw new Error(`Failed to hydrate movies: ${error.message}`);

    return data as MovieDto[];
  }
}
