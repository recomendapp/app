import { Inject, Injectable } from '@nestjs/common';
import { SupabaseUserClient } from '../../../common/supabase/supabase-user-client';
import { TYPESENSE_CLIENT } from '../../../common/typesense/typesense.module';
import { Client as TypesenseClient } from 'typesense';
import { SearchTvSeriesResponse } from './dto/search-tv-series-response.dto';
import { SearchTvSeriesQueryDto } from './dto/search-tv-series-query.dto';

@Injectable()
export class TvSeriesSearchService {
  constructor(
    private readonly supabaseClient: SupabaseUserClient,
    @Inject(TYPESENSE_CLIENT) private readonly typesenseClient: TypesenseClient,
  ) {}

  async search({
    q: query,
    page = 1,
    per_page = 10,
    sort_by = 'popularity',
    genre_ids,
    number_of_seasons_min,
    number_of_seasons_max,
    number_of_episodes_min,
    number_of_episodes_max,
    vote_average_min,
    vote_average_max,
    first_air_date_min,
    first_air_date_max,
  }: SearchTvSeriesQueryDto): Promise<SearchTvSeriesResponse> {
    const sortOrder = `${sort_by}:desc`;

    const searchParameters = {
      q: query,
      query_by: 'original_name,names',
      page: page,
      per_page: per_page,
      sort_by: `_text_match(buckets: 10):desc,${sortOrder}`,
      filter_by: '',
    };

    const filters: string[] = [];

    if (genre_ids && genre_ids.length > 0) {
      const genres = genre_ids
        .split(',')
        .map((id) => parseInt(id, 10))
        .filter((id) => !isNaN(id));
      if (genres.length > 0) {
        filters.push(`genre_ids:[${genres.join(',')}]`);
      }
    }

    // Number of Seasons
    if (number_of_seasons_min && number_of_seasons_max) {
      filters.push(
        `number_of_seasons:[${number_of_seasons_min}..${number_of_seasons_max}]`,
      );
    } else if (number_of_seasons_min) {
      filters.push(`number_of_seasons:>=${number_of_seasons_min}`);
    } else if (number_of_seasons_max) {
      filters.push(`number_of_seasons:<=${number_of_seasons_max}`);
    }

    // Number of Episodes
    if (number_of_episodes_min && number_of_episodes_max) {
      filters.push(
        `number_of_episodes:[${number_of_episodes_min}..${number_of_episodes_max}]`,
      );
    } else if (number_of_episodes_min) {
      filters.push(`number_of_episodes:>=${number_of_episodes_min}`);
    } else if (number_of_episodes_max) {
      filters.push(`number_of_episodes:<=${number_of_episodes_max}`);
    }

    // Vote Average
    if (vote_average_min && vote_average_max) {
      filters.push(`vote_average:[${vote_average_min}..${vote_average_max}]`);
    } else if (vote_average_min) {
      filters.push(`vote_average:>=${vote_average_min}`);
    } else if (vote_average_max) {
      filters.push(`vote_average:<=${vote_average_max}`);
    }

    // First Air Date (assuming it's a Unix timestamp in Typesense)
    if (first_air_date_min && first_air_date_max) {
      const minDate = new Date(first_air_date_min).getTime() / 1000;
      const maxDate = new Date(first_air_date_max).getTime() / 1000;
      filters.push(`first_air_date:[${minDate}..${maxDate}]`);
    } else if (first_air_date_min) {
      const minDate = new Date(first_air_date_min).getTime() / 1000;
      filters.push(`first_air_date:>=${minDate}`);
    } else if (first_air_date_max) {
      const maxDate = new Date(first_air_date_max).getTime() / 1000;
      filters.push(`first_air_date:<=${maxDate}`);
    }

    if (filters.length > 0) {
      searchParameters.filter_by = filters.join(' && ');
    }

    const typesenseResult = await this.typesenseClient
      .collections<{ id: string }>('tv_series')
      .documents()
      .search(searchParameters);

    const tvSeriesIds =
      typesenseResult.hits?.map((hit) => hit.document.id) || [];

    if (!tvSeriesIds || tvSeriesIds.length === 0) {
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

    const hydratedTvSeries = await this.hydrateTvSeries(
      tvSeriesIds.map((id) => parseInt(id, 10)),
    );

    const tvSeriesMap = new Map(hydratedTvSeries.map((p) => [String(p.id), p]));
    const sortedTvSeries = tvSeriesIds
      .map((id) => tvSeriesMap.get(id))
      .filter(Boolean) as typeof hydratedTvSeries;

    return {
      data: sortedTvSeries,
      pagination: {
        total_results: typesenseResult.found,
        total_pages: Math.ceil(typesenseResult.found / per_page),
        current_page: page,
        per_page: per_page,
      },
    };
  }

  private async hydrateTvSeries(ids: number[]) {
    if (ids.length === 0) return [];

    const { data, error } = await this.supabaseClient
      .from('media_tv_series')
      .select('*')
      .in('id', ids);

    if (error) throw new Error(`Failed to hydrate TV series: ${error.message}`);

    return data;
  }
}
