import type { Client as TypesenseClient } from 'typesense';
import {
  createTestMovie,
  createTestPerson,
  createTestPlaylist,
  createTestTvSeries,
  createTestUser,
  TestDatabase,
} from '@libs/testing';
import { defaultSupportedLocale } from '@libs/i18n';
import { User } from '../auth/auth.service';
import { SearchMoviesService } from './movies/search-movies.service';
import { SearchTvSeriesService } from './tv-series/search-tv-series.service';
import { SearchPersonsService } from './persons/search-persons.service';
import { SearchUsersService } from './users/search-users.service';
import { SearchPlaylistsService } from './playlists/search-playlists.service';
import { SearchService } from './search.service';

type Hit = {
  document: { id: string; popularity?: number; followers_count?: number; likes_count?: number };
  text_match?: number;
};

function fakeMultiSearchClient(hitsByCollection: {
  movies?: Hit[];
  tv_series?: Hit[];
  persons?: Hit[];
  users?: Hit[];
  playlists?: Hit[];
}) {
  const perform = jest.fn().mockResolvedValue({
    results: [
      { hits: hitsByCollection.movies ?? [] },
      { hits: hitsByCollection.tv_series ?? [] },
      { hits: hitsByCollection.persons ?? [] },
      { hits: hitsByCollection.users ?? [] },
      { hits: hitsByCollection.playlists ?? [] },
    ],
  });
  return { client: { multiSearch: { perform } } as unknown as TypesenseClient, perform };
}

describe('SearchService', () => {
  let testDb: TestDatabase;

  beforeAll(async () => {
    testDb = await TestDatabase.create();
  });

  afterEach(async () => {
    await testDb.reset();
  });

  afterAll(async () => {
    await testDb.close();
  });

  const asUser = (row: { id: string }) => row as unknown as User;

  function buildService(typesenseClient: TypesenseClient) {
    const dummyClient = {} as unknown as TypesenseClient;
    return new SearchService(
      testDb.db,
      typesenseClient,
      new SearchMoviesService(testDb.db, dummyClient),
      new SearchTvSeriesService(testDb.db, dummyClient),
      new SearchPersonsService(testDb.db, dummyClient),
      new SearchUsersService(testDb.db, dummyClient),
      new SearchPlaylistsService(testDb.db, dummyClient),
    );
  }

  it('hydrates every category and picks the highest hybrid-scored candidate as best_result', async () => {
    const movie = await createTestMovie(testDb.db);
    const tvSeries = await createTestTvSeries(testDb.db);
    const person = await createTestPerson(testDb.db);
    const { user } = await createTestUser(testDb.db);
    const { user: owner } = await createTestUser(testDb.db);
    const playlist = await createTestPlaylist(testDb.db, { userId: owner.id });

    const { client } = fakeMultiSearchClient({
      movies: [{ document: { id: String(movie.id), popularity: 5 }, text_match: 100 }],
      tv_series: [{ document: { id: String(tvSeries.id), popularity: 5 }, text_match: 50 }],
      persons: [{ document: { id: String(person.id), popularity: 1 }, text_match: 10 }],
      users: [{ document: { id: user.id, followers_count: 10 }, text_match: 30 }],
      playlists: [{ document: { id: String(playlist.id), likes_count: 2 }, text_match: 20 }],
    });

    const result = await buildService(client).search({
      currentUser: null,
      locale: defaultSupportedLocale,
      dto: { q: 'test', limit: 5 },
    });

    expect(result.movies.map((m) => m.id)).toEqual([movie.id]);
    expect(result.tv_series.map((s) => s.id)).toEqual([tvSeries.id]);
    expect(result.persons.map((p) => p.id)).toEqual([person.id]);
    expect(result.users.map((u) => u.id)).toEqual([user.id]);
    expect(result.playlists.map((p) => p.id)).toEqual([playlist.id]);
    // (100/100)*0.9 + (5/10)*0.1 = 0.95 is the highest hybrid score among the candidates.
    expect(result.best_result).toMatchObject({ type: 'movie', data: { id: movie.id } });
  });

  it('returns a null best_result when nothing matches', async () => {
    const { client } = fakeMultiSearchClient({});

    const result = await buildService(client).search({
      currentUser: null,
      locale: defaultSupportedLocale,
      dto: { q: 'nothing', limit: 5 },
    });

    expect(result.best_result).toBeNull();
    expect(result.movies).toEqual([]);
    expect(result.tv_series).toEqual([]);
    expect(result.persons).toEqual([]);
    expect(result.users).toEqual([]);
    expect(result.playlists).toEqual([]);
  });

  it('excludes a stale hit whose document no longer exists in the database from best_result', async () => {
    const person = await createTestPerson(testDb.db);

    const { client } = fakeMultiSearchClient({
      // This movie id was returned by typesense but the movie was since deleted from Postgres.
      movies: [{ document: { id: '999999', popularity: 1000 }, text_match: 1000 }],
      persons: [{ document: { id: String(person.id), popularity: 1 }, text_match: 1 }],
    });

    const result = await buildService(client).search({
      currentUser: null,
      locale: defaultSupportedLocale,
      dto: { q: 'test', limit: 5 },
    });

    expect(result.movies).toEqual([]);
    expect(result.best_result).toMatchObject({ type: 'person', data: { id: person.id } });
  });

  it('keeps the first candidate on a hybrid-score tie', async () => {
    const movie = await createTestMovie(testDb.db);
    const tvSeries = await createTestTvSeries(testDb.db);

    const { client } = fakeMultiSearchClient({
      movies: [{ document: { id: String(movie.id), popularity: 5 }, text_match: 50 }],
      tv_series: [{ document: { id: String(tvSeries.id), popularity: 5 }, text_match: 50 }],
    });

    const result = await buildService(client).search({
      currentUser: null,
      locale: defaultSupportedLocale,
      dto: { q: 'test', limit: 5 },
    });

    expect(result.best_result).toMatchObject({ type: 'movie' });
  });

  it('sends a multi-search payload scoped by limit and the playlist visibility filter', async () => {
    const { user } = await createTestUser(testDb.db);
    const { client, perform } = fakeMultiSearchClient({});

    await buildService(client).search({
      currentUser: asUser(user),
      locale: defaultSupportedLocale,
      dto: { q: 'nolan', limit: 7 },
    });

    expect(perform).toHaveBeenCalledWith({
      searches: [
        expect.objectContaining({ collection: 'movies', q: 'nolan', page: 1, per_page: 7 }),
        expect.objectContaining({ collection: 'tv_series', q: 'nolan', page: 1, per_page: 7 }),
        expect.objectContaining({ collection: 'persons', q: 'nolan', page: 1, per_page: 7 }),
        expect.objectContaining({ collection: 'users', q: 'nolan', page: 1, per_page: 7 }),
        expect.objectContaining({
          collection: 'playlists',
          q: 'nolan',
          page: 1,
          per_page: 7,
          filter_by: `visibility:=public || owner_id:=${user.id} || member_ids:=${user.id}`,
        }),
      ],
    });
  });
});
