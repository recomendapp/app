import { Inject, Injectable } from '@nestjs/common';
import { SupabaseUserClient } from 'apps/gateway/src/common/supabase/supabase-user-client';
import { TYPESENSE_CLIENT } from 'apps/gateway/src/common/typesense/typesense.module';
import { Client as TypesenseClient } from 'typesense';
import { BestResultSearchQueryDto } from './dto/best-result-search-query.dto';
import {
  SearchBestResultResponse,
  BestResultItem,
} from './dto/best-result-search-response.dto';
import { Movie } from 'apps/gateway/src/common/dto/movie.dto';
import { TvSeries } from 'apps/gateway/src/common/dto/tv-series.dto';
import { Person } from 'apps/gateway/src/common/dto/person.dto';
import { Playlist } from 'apps/gateway/src/common/dto/playlist.dto';
import { Profile } from 'apps/gateway/src/common/dto/profile.dto';
import { TypesenseSearchResult } from 'apps/gateway/src/types/typesense';

type TypesenseHitDocument = {
  id: string;
  popularity?: number;
  followers_count?: number;
  likes_count?: number;
};

@Injectable()
export class BestResultSearchService {
  constructor(
    private readonly supabaseClient: SupabaseUserClient,
    @Inject(TYPESENSE_CLIENT) private readonly typesenseClient: TypesenseClient,
  ) {}

  async search({
    q: query,
    results_per_type = 5,
    userId,
  }: BestResultSearchQueryDto & {
    userId?: string;
  }): Promise<SearchBestResultResponse> {
    const commonSearchParams = {
      q: query,
      page: 1,
      per_page: results_per_type,
    };

    const searches = {
      searches: [
        {
          collection: 'movies',
          query_by: 'original_title,titles',
          sort_by: '_text_match(buckets: 10):desc,popularity:desc',
        },
        {
          collection: 'tv_series',
          query_by: 'original_name,names',
          sort_by: '_text_match(buckets: 10):desc,popularity:desc',
        },
        {
          collection: 'persons',
          query_by: 'name,also_known_as',
          sort_by: '_text_match:desc,popularity:desc',
        },
        {
          collection: 'users',
          query_by: 'username,full_name',
          sort_by: '_text_match:desc,followers_count:desc',
        },
        {
          collection: 'playlists',
          query_by: 'title,description',
          filter_by: this.getPlaylistPermissionFilter(userId),
          sort_by: '_text_match(buckets: 10):desc,likes_count:desc', // Using likes_count as per example
        },
      ],
    };

    const multiSearchResult = await this.typesenseClient.multiSearch.perform(
      searches,
      commonSearchParams,
    );

    const results: TypesenseSearchResult<TypesenseHitDocument>[] =
      multiSearchResult.results;

    const [
      moviesResult,
      tvSeriesResult,
      personsResult,
      usersResult,
      playlistsResult,
    ] = results;

    // Extract IDs from search results
    const movieIds = moviesResult.hits?.map((h) => h.document.id) || [];
    const tvSeriesIds = tvSeriesResult.hits?.map((h) => h.document.id) || [];
    const personIds = personsResult.hits?.map((h) => h.document.id) || [];
    const userIds = usersResult.hits?.map((h) => h.document.id) || [];
    const playlistIds = playlistsResult.hits?.map((h) => h.document.id) || [];

    // Hydrate results in parallel
    const [
      hydratedMovies,
      hydratedTvSeries,
      hydratedPersons,
      hydratedUsers,
      hydratedPlaylists,
    ] = await Promise.all([
      this.hydrateByIds<Movie>(
        this.supabaseClient,
        'media_movie',
        movieIds.map((id) => parseInt(id, 10)),
      ),
      this.hydrateByIds<TvSeries>(
        this.supabaseClient,
        'media_tv_series',
        tvSeriesIds.map((id) => parseInt(id, 10)),
      ),
      this.hydrateByIds<Person>(
        this.supabaseClient,
        'media_person',
        personIds.map((id) => parseInt(id, 10)),
      ),
      this.hydrateByIds<Profile>(this.supabaseClient, 'profile', userIds), // userIds are strings
      this.hydratePlaylists(
        this.supabaseClient,
        playlistIds.map((id) => parseInt(id, 10)),
      ),
    ]);

    // Calculate bestResult
    let bestResultMeta: {
      type: BestResultItem['type'];
      id: string;
      score: number;
    } | null = null;
    const potentialBest = [
      { type: 'movie', hit: moviesResult.hits?.[0] },
      { type: 'tv_series', hit: tvSeriesResult.hits?.[0] },
      { type: 'person', hit: personsResult.hits?.[0] },
      { type: 'user', hit: usersResult.hits?.[0] },
      { type: 'playlist', hit: playlistsResult.hits?.[0] },
    ];
    const allHits = potentialBest
      .map((c) => c.hit)
      .filter(Boolean) as NonNullable<(typeof potentialBest)[0]['hit']>[];
    const maxTextScore = Math.max(...allHits.map((h) => h.text_match || 0), 1);
    const maxPopularity = Math.max(
      ...allHits.map(
        (h) =>
          h.document.popularity ||
          h.document.followers_count ||
          h.document.likes_count ||
          0,
      ),
      1,
    );

    for (const candidate of potentialBest) {
      if (candidate.hit?.document) {
        const doc = candidate.hit.document;
        const textScore = candidate.hit.text_match || 0;
        const popularityMetric =
          doc.popularity || doc.followers_count || doc.likes_count || 0;

        const normalizedText = textScore / maxTextScore;
        const normalizedPop = popularityMetric / maxPopularity;

        const hybridScore = normalizedText * 0.9 + normalizedPop * 0.1;

        if (!bestResultMeta || hybridScore > bestResultMeta.score) {
          bestResultMeta = {
            type: candidate.type as BestResultItem['type'],
            id: doc.id,
            score: hybridScore,
          };
        }
      }
    }

    let bestResult: BestResultItem | null = null;
    if (bestResultMeta) {
      let bestResultData:
        | Movie
        | TvSeries
        | Person
        | Profile
        | Playlist
        | null = null;
      switch (bestResultMeta.type) {
        case 'movie':
          bestResultData =
            hydratedMovies.find(
              (item) => item.id == parseInt(bestResultMeta.id, 10),
            ) || null;
          break;
        case 'tv_series':
          bestResultData =
            hydratedTvSeries.find(
              (item) => item.id == parseInt(bestResultMeta.id, 10),
            ) || null;
          break;
        case 'person':
          bestResultData =
            hydratedPersons.find(
              (item) => item.id == parseInt(bestResultMeta.id, 10),
            ) || null;
          break;
        case 'user':
          bestResultData =
            hydratedUsers.find((item) => item.id == bestResultMeta.id) || null;
          break;
        case 'playlist':
          bestResultData =
            hydratedPlaylists.find(
              (item) => item.id == parseInt(bestResultMeta.id, 10),
            ) || null;
          break;
      }
      if (bestResultData) {
        bestResult = { type: bestResultMeta.type, data: bestResultData };
      }
    }

    return {
      bestResult,
      movies: {
        data: hydratedMovies,
        pagination: {
          total_results: moviesResult.found,
          total_pages: Math.ceil(moviesResult.found / results_per_type),
          current_page: 1,
          per_page: results_per_type,
        },
      },
      tv_series: {
        data: hydratedTvSeries,
        pagination: {
          total_results: tvSeriesResult.found,
          total_pages: Math.ceil(tvSeriesResult.found / results_per_type),
          current_page: 1,
          per_page: results_per_type,
        },
      },
      persons: {
        data: hydratedPersons,
        pagination: {
          total_results: personsResult.found,
          total_pages: Math.ceil(personsResult.found / results_per_type),
          current_page: 1,
          per_page: results_per_type,
        },
      },
      users: {
        data: hydratedUsers,
        pagination: {
          total_results: usersResult.found,
          total_pages: Math.ceil(usersResult.found / results_per_type),
          current_page: 1,
          per_page: results_per_type,
        },
      },
      playlists: {
        data: hydratedPlaylists,
        pagination: {
          total_results: playlistsResult.found,
          total_pages: Math.ceil(playlistsResult.found / results_per_type),
          current_page: 1,
          per_page: results_per_type,
        },
      },
    };
  }

  // --- Utility Methods (Hydration and Filters) ---

  private getPlaylistPermissionFilter = (userId?: string): string => {
    return userId
      ? `is_private:false || owner_id:=${userId} || guest_ids:=${userId}`
      : 'is_private:false';
  };

  private async hydrateByIds<T>(
    supabaseClient: SupabaseUserClient,
    tableName: 'media_movie' | 'media_tv_series' | 'media_person' | 'profile',
    ids: (number | string)[],
  ): Promise<T[]> {
    if (ids.length === 0) return [];

    const { data, error } = await supabaseClient
      .from(tableName)
      .select('*')
      .in('id', ids);

    if (error)
      throw new Error(`Failed to hydrate ${tableName}: ${error.message}`);

    return data as T[];
  }

  private async hydratePlaylists(
    supabaseClient: SupabaseUserClient,
    ids: number[],
  ): Promise<Playlist[]> {
    if (ids.length === 0) return [];

    const { data, error } = await supabaseClient
      .from('playlists')
      .select('*, user:profile(*)')
      .in('id', ids);

    if (error) throw new Error(`Failed to hydrate playlists: ${error.message}`);

    return data as Playlist[];
  }
}
