import {
  followPerson,
  tmdbCountry,
  tmdbMovieCredit,
  tmdbMovieReleaseDate,
  tmdbTvEpisode,
  tmdbTvSeason,
  tmdbTvSeasonCredit,
  tmdbTvSeriesCredit,
} from '@libs/db/schemas';
import {
  createTestMovie,
  createTestPerson,
  createTestTvSeries,
  createTestUser,
  TestDatabase,
} from '@libs/testing';
import { defaultSupportedLocale } from '@libs/i18n';
import { User } from '../../auth/auth.service';
import { PersonFeedSortBy } from '../../persons/feed/dto/person-feed.dto';
import { SortOrder } from '../../../common/dto/sort.dto';
import { FeedPersonsService } from './feed-persons.service';

function randomTmdbId(): number {
  return Math.floor(Math.random() * 1_000_000_000) + 1;
}

function randomCreditId(): string {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

describe('FeedPersonsService', () => {
  let testDb: TestDatabase;

  beforeAll(async () => {
    testDb = await TestDatabase.create();
    await testDb.db.insert(tmdbCountry).values({ iso31661: 'US' }).onConflictDoNothing();
  });

  afterEach(async () => {
    await testDb.reset();
    await testDb.db.insert(tmdbCountry).values({ iso31661: 'US' }).onConflictDoNothing();
  });

  afterAll(async () => {
    await testDb.close();
  });

  const asUser = (row: { id: string }) => row as unknown as User;
  const service = () => new FeedPersonsService(testDb.db);
  const baseQuery = {
    sort_by: PersonFeedSortBy.DATE,
    sort_order: SortOrder.ASC,
    min_date: '1970-01-01',
  };

  async function releaseMovie(movieId: number, releaseDate: string) {
    await testDb.db
      .insert(tmdbMovieReleaseDate)
      .values({ movieId, iso31661: 'US', releaseDate, releaseType: 3 });
  }

  async function addMovieCredit(movieId: number, personId: number, job = 'Director') {
    await testDb.db.insert(tmdbMovieCredit).values({
      id: randomCreditId(),
      movieId,
      personId,
      department: 'Directing',
      job,
    });
  }

  async function addTvSeriesCreditWithAirDate(
    tvSeriesId: number,
    personId: number,
    airDate: string,
    job = 'Director',
  ) {
    const creditId = randomCreditId();
    await testDb.db
      .insert(tmdbTvSeriesCredit)
      .values({ id: creditId, tvSeriesId, personId, department: 'Directing', job });

    const [season] = await testDb.db
      .insert(tmdbTvSeason)
      .values({
        id: randomTmdbId(),
        tvSeriesId,
        seasonNumber: 1,
        episodeCount: 1,
        voteAverage: 0,
        voteCount: 0,
      })
      .returning();
    await testDb.db
      .insert(tmdbTvEpisode)
      .values({ id: randomTmdbId(), tvSeasonId: season.id, episodeNumber: 1, airDate });
    await testDb.db.insert(tmdbTvSeasonCredit).values({ creditId, tvSeasonId: season.id });
  }

  async function follow(userId: string, personId: number) {
    await testDb.db.insert(followPerson).values({ userId, personId });
  }

  describe('refreshTrendingView', () => {
    it('runs without throwing even with no data', async () => {
      await expect(service().refreshTrendingView()).resolves.toBeUndefined();
    });
  });

  describe('listPaginated', () => {
    it('returns an empty feed when following nobody', async () => {
      const { user } = await createTestUser(testDb.db);

      const result = await service().listPaginated({
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: asUser(user),
        locale: defaultSupportedLocale,
      });

      expect(result.data).toEqual([]);
    });

    it('includes a movie credit from a followed person, once the view is refreshed', async () => {
      const { user } = await createTestUser(testDb.db);
      const person = await createTestPerson(testDb.db);
      const movie = await createTestMovie(testDb.db);
      await addMovieCredit(movie.id, person.id);
      await releaseMovie(movie.id, '2020-01-01');
      await follow(user.id, person.id);
      await service().refreshTrendingView();

      const result = await service().listPaginated({
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: asUser(user),
        locale: defaultSupportedLocale,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        type: 'movie',
        mediaId: movie.id,
        jobs: ['Director'],
      });
    });

    it('excludes a movie credit from a person the user does not follow', async () => {
      const { user } = await createTestUser(testDb.db);
      const person = await createTestPerson(testDb.db);
      const movie = await createTestMovie(testDb.db);
      await addMovieCredit(movie.id, person.id);
      await releaseMovie(movie.id, '2020-01-01');
      // Note: no follow() call.
      await service().refreshTrendingView();

      const result = await service().listPaginated({
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: asUser(user),
        locale: defaultSupportedLocale,
      });

      expect(result.data).toEqual([]);
    });

    it('excludes a movie credit that has no release date', async () => {
      const { user } = await createTestUser(testDb.db);
      const person = await createTestPerson(testDb.db);
      const movie = await createTestMovie(testDb.db);
      await addMovieCredit(movie.id, person.id);
      // No releaseMovie() call.
      await follow(user.id, person.id);
      await service().refreshTrendingView();

      const result = await service().listPaginated({
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: asUser(user),
        locale: defaultSupportedLocale,
      });

      expect(result.data).toEqual([]);
    });

    it('includes a tv series credit from a followed person, dated from its episode air date', async () => {
      const { user } = await createTestUser(testDb.db);
      const person = await createTestPerson(testDb.db);
      const series = await createTestTvSeries(testDb.db);
      await addTvSeriesCreditWithAirDate(series.id, person.id, '2021-06-15');
      await follow(user.id, person.id);
      await service().refreshTrendingView();

      const result = await service().listPaginated({
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: asUser(user),
        locale: defaultSupportedLocale,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({ type: 'tv_series', mediaId: series.id });
    });

    it('filters out items outside the min_date/max_date range', async () => {
      const { user } = await createTestUser(testDb.db);
      const person = await createTestPerson(testDb.db);
      const early = await createTestMovie(testDb.db);
      const late = await createTestMovie(testDb.db);
      await addMovieCredit(early.id, person.id);
      await releaseMovie(early.id, '2010-01-01');
      await addMovieCredit(late.id, person.id);
      await releaseMovie(late.id, '2030-01-01');
      await follow(user.id, person.id);
      await service().refreshTrendingView();

      const result = await service().listPaginated({
        query: {
          ...baseQuery,
          page: 1,
          per_page: 10,
          min_date: '2015-01-01',
          max_date: '2025-01-01',
        },
        currentUser: asUser(user),
        locale: defaultSupportedLocale,
      });

      expect(result.data).toEqual([]);
    });

    it('sorts by date ascending by default', async () => {
      const { user } = await createTestUser(testDb.db);
      const person = await createTestPerson(testDb.db);
      const older = await createTestMovie(testDb.db);
      const newer = await createTestMovie(testDb.db);
      await addMovieCredit(older.id, person.id);
      await releaseMovie(older.id, '2010-01-01');
      await addMovieCredit(newer.id, person.id);
      await releaseMovie(newer.id, '2020-01-01');
      await follow(user.id, person.id);
      await service().refreshTrendingView();

      const result = await service().listPaginated({
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: asUser(user),
        locale: defaultSupportedLocale,
      });

      expect(result.data.map((r) => r.mediaId)).toEqual([older.id, newer.id]);
    });

    it('paginates results and reports accurate meta', async () => {
      const { user } = await createTestUser(testDb.db);
      const person = await createTestPerson(testDb.db);
      for (let i = 0; i < 3; i++) {
        const movie = await createTestMovie(testDb.db);
        await addMovieCredit(movie.id, person.id);
        await releaseMovie(movie.id, `202${i}-01-01`);
      }
      await follow(user.id, person.id);
      await service().refreshTrendingView();

      const page1 = await service().listPaginated({
        query: { ...baseQuery, page: 1, per_page: 2 },
        currentUser: asUser(user),
        locale: defaultSupportedLocale,
      });
      expect(page1.data).toHaveLength(2);
      expect(page1.meta).toEqual({
        total_results: 3,
        total_pages: 2,
        current_page: 1,
        per_page: 2,
      });
    });
  });

  describe('listInfinite', () => {
    it('paginates with a cursor until there is no next page', async () => {
      const { user } = await createTestUser(testDb.db);
      const person = await createTestPerson(testDb.db);
      const movies = [];
      for (let i = 0; i < 3; i++) {
        const movie = await createTestMovie(testDb.db);
        await addMovieCredit(movie.id, person.id);
        await releaseMovie(movie.id, `202${i}-01-01`);
        movies.push(movie);
      }
      await follow(user.id, person.id);
      await service().refreshTrendingView();

      const firstPage = await service().listInfinite({
        query: { ...baseQuery, per_page: 2 },
        currentUser: asUser(user),
        locale: defaultSupportedLocale,
      });
      expect(firstPage.data).toHaveLength(2);
      expect(firstPage.meta.next_cursor).not.toBeNull();

      const secondPage = await service().listInfinite({
        query: { ...baseQuery, per_page: 2, cursor: firstPage.meta.next_cursor ?? undefined },
        currentUser: asUser(user),
        locale: defaultSupportedLocale,
      });
      expect(secondPage.data).toHaveLength(1);
      expect(secondPage.meta.next_cursor).toBeNull();

      const allIds = [...firstPage.data, ...secondPage.data].map((r) => r.mediaId).sort();
      expect(allIds).toEqual(movies.map((m) => m.id).sort());
    });
  });
});
