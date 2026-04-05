import { Inject, Injectable } from '@nestjs/common';
import { Client as TypesenseClient } from 'typesense';
import { TYPESENSE_CLIENT } from '../../common/modules/typesense/typesense.module';
import { DRIZZLE_SERVICE, DrizzleService } from '../../common/modules/drizzle/drizzle.module';
import { User } from '../auth/auth.service';
import { SupportedLocale } from '@libs/i18n';
import { sql } from 'drizzle-orm';
import { SearchMoviesService } from './movies/search-movies.service';
import { SearchTvSeriesService } from './tv-series/search-tv-series.service';
import { SearchPersonsService } from './persons/search-persons.service';
import { SearchUsersService } from './users/search-users.service';
import { SearchPlaylistsService } from './playlists/search-playlists.service';
import { plainToInstance } from 'class-transformer';
import { TypesenseSearchResult } from '../../common/modules/typesense/typesense.type';
import { SearchQueryDto, SearchResponseDto } from './search.dto';

type TypesenseHit = {
  document: {
    id: string;
    popularity?: number;
    followers_count?: number;
    likes_count?: number;
  };
  text_match?: number;
};

@Injectable()
export class SearchService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
    @Inject(TYPESENSE_CLIENT) private readonly typesenseClient: TypesenseClient,
    private readonly searchMoviesService: SearchMoviesService,
    private readonly searchTvSeriesService: SearchTvSeriesService,
    private readonly searchPersonsService: SearchPersonsService,
    private readonly searchUsersService: SearchUsersService,
    private readonly searchPlaylistsService: SearchPlaylistsService,
  ) {}

  async search({
    currentUser,
    locale,
    dto,
  }: {
    currentUser: User | null;
    locale: SupportedLocale;
    dto: SearchQueryDto;
  }): Promise<SearchResponseDto> {
    const { q, limit } = dto;

    const playlistFilter = await this.searchPlaylistsService.buildFilterBy(currentUser);

    const multiSearchPayload = {
      searches: [
        {
          collection: 'movies',
          q,
          query_by: 'original_title,titles',
          sort_by: '_text_match(buckets: 10):desc,popularity:desc',
        },
        {
          collection: 'tv_series',
          q,
          query_by: 'original_name,names',
          sort_by: '_text_match(buckets: 10):desc,popularity:desc',
        },
        {
          collection: 'persons',
          q,
          query_by: 'name,also_known_as',
          sort_by: '_text_match(buckets: 10):desc,popularity:desc',
        },
        {
          collection: 'users',
          q,
          query_by: 'username,name',
          sort_by: '_text_match(buckets: 10):desc,followers_count:desc',
        },
        {
          collection: 'playlists',
          q,
          query_by: 'title,description',
          filter_by: playlistFilter,
          sort_by: '_text_match(buckets: 10):desc,likes_count:desc',
        },
      ].map(search => ({ ...search, page: 1, per_page: limit })),
    };

    const { results } = await this.typesenseClient.multiSearch.perform(multiSearchPayload);
    const [moviesRes, tvRes, personsRes, usersRes, playlistsRes] = results as TypesenseSearchResult<any>[];

    const movieIds = moviesRes.hits?.map((h: TypesenseHit) => h.document.id) || [];
    const tvIds = tvRes.hits?.map((h: TypesenseHit) => h.document.id) || [];
    const personIds = personsRes.hits?.map((h: TypesenseHit) => h.document.id) || [];
    const userIds = usersRes.hits?.map((h: TypesenseHit) => h.document.id) || [];
    const playlistIds = playlistsRes.hits?.map((h: TypesenseHit) => h.document.id) || [];

    const [hydratedMovies, hydratedTvSeries, hydratedPersons] = await this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_language', ${locale}, true)`);
      if (currentUser) {
        await tx.execute(sql`SELECT set_config('app.current_user_id', ${currentUser.id}, true)`);
      }
      return Promise.all([
        this.searchMoviesService.hydrateMovies(tx, movieIds),
        this.searchTvSeriesService.hydrateTvSeries(tx, tvIds),
        this.searchPersonsService.hydratePersons(tx, personIds),
      ]);
    });

    const [hydratedUsers, rawHydratedPlaylists] = await Promise.all([
      this.searchUsersService.hydrateUsers(userIds),
      this.searchPlaylistsService.hydratePlaylists(playlistIds, currentUser),
    ]);

    const hydratedPlaylists = rawHydratedPlaylists.map(({ playlist, owner, role }) => ({
      ...playlist,
      owner,
      role,
    }));

    const candidates = [
      { type: 'movie', hit: moviesRes.hits?.[0] as TypesenseHit, data: hydratedMovies[0] },
      { type: 'tv_series', hit: tvRes.hits?.[0] as TypesenseHit, data: hydratedTvSeries[0] },
      { type: 'person', hit: personsRes.hits?.[0] as TypesenseHit, data: hydratedPersons[0] },
      { type: 'user', hit: usersRes.hits?.[0] as TypesenseHit, data: hydratedUsers[0] },
      { type: 'playlist', hit: playlistsRes.hits?.[0] as TypesenseHit, data: hydratedPlaylists[0] },
    ].filter(c => c.hit && c.data);

    let bestResult = null;
    
    if (candidates.length > 0) {
      const maxTextScore = Math.max(...candidates.map(c => c.hit.text_match || 0), 1);
      const maxPop = Math.max(
        ...candidates.map(c => c.hit.document.popularity || c.hit.document.followers_count || c.hit.document.likes_count || 0), 
        1
      );

      let highestScore = -1;

      for (const candidate of candidates) {
        const textScore = candidate.hit.text_match || 0;
        const pop = candidate.hit.document.popularity || candidate.hit.document.followers_count || candidate.hit.document.likes_count || 0;
        
        const hybridScore = (textScore / maxTextScore) * 0.9 + (pop / maxPop) * 0.1;

        if (hybridScore > highestScore) {
          highestScore = hybridScore;
          bestResult = {
            type: candidate.type,
            data: candidate.data,
          };
        }
      }
    }
    return plainToInstance(SearchResponseDto, {
      best_result: bestResult,
      movies: hydratedMovies,
      tv_series: hydratedTvSeries,
      persons: hydratedPersons,
      users: hydratedUsers,
      playlists: hydratedPlaylists,
    }, { excludeExtraneousValues: true });
  }
}