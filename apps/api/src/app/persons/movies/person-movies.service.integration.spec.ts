import { randomBytes } from 'node:crypto';
import { tmdbCountry, tmdbMovieCredit, tmdbMovieReleaseDate } from '@libs/db/schemas';
import { createTestMovie, createTestPerson, TestDatabase } from '@libs/testing';
import { defaultSupportedLocale } from '@libs/i18n';
import { MovieSortBy } from '../../movies/dto/movies.dto';
import { SortOrder } from '../../../common/dto/sort.dto';
import { PersonMoviesService } from './person-movies.service';

function randomCreditId(): string {
  return randomBytes(12).toString('hex');
}

describe('PersonMoviesService', () => {
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

  const service = () => new PersonMoviesService(testDb.db);
  const baseQuery = { sort_by: MovieSortBy.RELEASE_DATE, sort_order: SortOrder.DESC };

  async function releaseMovie(movieId: number, releaseDate: string) {
    await testDb.db
      .insert(tmdbMovieReleaseDate)
      .values({ movieId, iso31661: 'US', releaseDate, releaseType: 3 });
  }

  async function addCredit(
    movieId: number,
    personId: number,
    overrides?: Partial<typeof tmdbMovieCredit.$inferInsert>,
  ) {
    await testDb.db.insert(tmdbMovieCredit).values({
      id: randomCreditId(),
      movieId,
      personId,
      department: 'Acting',
      job: 'Actor',
      ...overrides,
    });
  }

  describe('listPaginated', () => {
    it('returns an empty list when the person has no credits', async () => {
      const person = await createTestPerson(testDb.db);

      const result = await service().listPaginated({
        personId: person.id,
        query: { ...baseQuery, page: 1, per_page: 10 },
        locale: defaultSupportedLocale,
      });

      expect(result.data).toEqual([]);
      expect(result.meta.total_results).toBe(0);
    });

    it('returns movies the person has a credit on, with aggregated credits', async () => {
      const person = await createTestPerson(testDb.db);
      const movie = await createTestMovie(testDb.db);
      await releaseMovie(movie.id, '2020-01-01');
      await addCredit(movie.id, person.id, { department: 'Acting', job: 'Actor' });

      const result = await service().listPaginated({
        personId: person.id,
        query: { ...baseQuery, page: 1, per_page: 10 },
        locale: defaultSupportedLocale,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].movie.id).toBe(movie.id);
      expect(result.data[0].credits).toEqual([{ department: 'Acting', job: 'Actor' }]);
    });

    it('excludes movies without a release date', async () => {
      const person = await createTestPerson(testDb.db);
      const movie = await createTestMovie(testDb.db);
      await addCredit(movie.id, person.id);

      const result = await service().listPaginated({
        personId: person.id,
        query: { ...baseQuery, page: 1, per_page: 10 },
        locale: defaultSupportedLocale,
      });

      expect(result.data).toEqual([]);
    });

    it('does not leak movies credited to another person', async () => {
      const person = await createTestPerson(testDb.db);
      const other = await createTestPerson(testDb.db);
      const movie = await createTestMovie(testDb.db);
      await releaseMovie(movie.id, '2020-01-01');
      await addCredit(movie.id, other.id);

      const result = await service().listPaginated({
        personId: person.id,
        query: { ...baseQuery, page: 1, per_page: 10 },
        locale: defaultSupportedLocale,
      });

      expect(result.data).toEqual([]);
    });

    it('lists a movie only once even with multiple credits, aggregating all of them', async () => {
      const person = await createTestPerson(testDb.db);
      const movie = await createTestMovie(testDb.db);
      await releaseMovie(movie.id, '2020-01-01');
      await addCredit(movie.id, person.id, { department: 'Acting', job: 'Actor' });
      await addCredit(movie.id, person.id, { department: 'Writing', job: 'Writer' });

      const result = await service().listPaginated({
        personId: person.id,
        query: { ...baseQuery, page: 1, per_page: 10 },
        locale: defaultSupportedLocale,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].credits).toHaveLength(2);
      expect(result.data[0].credits).toEqual(
        expect.arrayContaining([
          { department: 'Acting', job: 'Actor' },
          { department: 'Writing', job: 'Writer' },
        ]),
      );
    });

    it('filters by department', async () => {
      const person = await createTestPerson(testDb.db);
      const actingMovie = await createTestMovie(testDb.db);
      const directingMovie = await createTestMovie(testDb.db);
      await releaseMovie(actingMovie.id, '2020-01-01');
      await releaseMovie(directingMovie.id, '2020-01-01');
      await addCredit(actingMovie.id, person.id, { department: 'Acting', job: 'Actor' });
      await addCredit(directingMovie.id, person.id, { department: 'Directing', job: 'Director' });

      const result = await service().listPaginated({
        personId: person.id,
        query: { ...baseQuery, page: 1, per_page: 10, department: 'Directing' },
        locale: defaultSupportedLocale,
      });

      expect(result.data.map((r) => r.movie.id)).toEqual([directingMovie.id]);
    });

    it('filters by job', async () => {
      const person = await createTestPerson(testDb.db);
      const directorMovie = await createTestMovie(testDb.db);
      const producerMovie = await createTestMovie(testDb.db);
      await releaseMovie(directorMovie.id, '2020-01-01');
      await releaseMovie(producerMovie.id, '2020-01-01');
      await addCredit(directorMovie.id, person.id, { department: 'Directing', job: 'Director' });
      await addCredit(producerMovie.id, person.id, { department: 'Production', job: 'Producer' });

      const result = await service().listPaginated({
        personId: person.id,
        query: { ...baseQuery, page: 1, per_page: 10, job: 'Producer' },
        locale: defaultSupportedLocale,
      });

      expect(result.data.map((r) => r.movie.id)).toEqual([producerMovie.id]);
    });

    it('sorts by release date descending by default', async () => {
      const person = await createTestPerson(testDb.db);
      const older = await createTestMovie(testDb.db);
      const newer = await createTestMovie(testDb.db);
      await releaseMovie(older.id, '2010-01-01');
      await releaseMovie(newer.id, '2020-01-01');
      await addCredit(older.id, person.id);
      await addCredit(newer.id, person.id);

      const result = await service().listPaginated({
        personId: person.id,
        query: { ...baseQuery, page: 1, per_page: 10 },
        locale: defaultSupportedLocale,
      });

      expect(result.data.map((r) => r.movie.id)).toEqual([newer.id, older.id]);
    });

    it('paginates results and reports accurate meta', async () => {
      const person = await createTestPerson(testDb.db);
      for (let i = 0; i < 3; i++) {
        const movie = await createTestMovie(testDb.db);
        await releaseMovie(movie.id, `202${i}-01-01`);
        await addCredit(movie.id, person.id);
      }

      const page1 = await service().listPaginated({
        personId: person.id,
        query: { ...baseQuery, page: 1, per_page: 2 },
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
      const person = await createTestPerson(testDb.db);
      const movies = [];
      for (let i = 0; i < 3; i++) {
        const movie = await createTestMovie(testDb.db);
        await releaseMovie(movie.id, `202${i}-01-01`);
        await addCredit(movie.id, person.id);
        movies.push(movie);
      }

      const firstPage = await service().listInfinite({
        personId: person.id,
        query: { ...baseQuery, per_page: 2 },
        locale: defaultSupportedLocale,
      });
      expect(firstPage.data).toHaveLength(2);
      expect(firstPage.meta.next_cursor).not.toBeNull();

      const secondPage = await service().listInfinite({
        personId: person.id,
        query: { ...baseQuery, per_page: 2, cursor: firstPage.meta.next_cursor ?? undefined },
        locale: defaultSupportedLocale,
      });
      expect(secondPage.data).toHaveLength(1);
      expect(secondPage.meta.next_cursor).toBeNull();

      const allIds = [...firstPage.data, ...secondPage.data].map((r) => r.movie.id).sort();
      expect(allIds).toEqual(movies.map((m) => m.id).sort());
    });

    it('paginates with a cursor when sorting by popularity', async () => {
      const person = await createTestPerson(testDb.db);
      const low = await createTestMovie(testDb.db, { popularity: 1 });
      const high = await createTestMovie(testDb.db, { popularity: 9 });
      await releaseMovie(low.id, '2020-01-01');
      await releaseMovie(high.id, '2020-01-01');
      await addCredit(low.id, person.id);
      await addCredit(high.id, person.id);

      const firstPage = await service().listInfinite({
        personId: person.id,
        query: { sort_by: MovieSortBy.POPULARITY, sort_order: SortOrder.DESC, per_page: 1 },
        locale: defaultSupportedLocale,
      });
      expect(firstPage.data.map((r) => r.movie.id)).toEqual([high.id]);
      expect(firstPage.meta.next_cursor).not.toBeNull();

      const secondPage = await service().listInfinite({
        personId: person.id,
        query: {
          sort_by: MovieSortBy.POPULARITY,
          sort_order: SortOrder.DESC,
          per_page: 1,
          cursor: firstPage.meta.next_cursor ?? undefined,
        },
        locale: defaultSupportedLocale,
      });
      expect(secondPage.data.map((r) => r.movie.id)).toEqual([low.id]);
      expect(secondPage.meta.next_cursor).toBeNull();
    });

    it('filters by department/job on the infinite list too', async () => {
      const person = await createTestPerson(testDb.db);
      const actingMovie = await createTestMovie(testDb.db);
      const directingMovie = await createTestMovie(testDb.db);
      await releaseMovie(actingMovie.id, '2020-01-01');
      await releaseMovie(directingMovie.id, '2020-01-01');
      await addCredit(actingMovie.id, person.id, { department: 'Acting', job: 'Actor' });
      await addCredit(directingMovie.id, person.id, { department: 'Directing', job: 'Director' });

      const result = await service().listInfinite({
        personId: person.id,
        query: { ...baseQuery, per_page: 10, department: 'Acting' },
        locale: defaultSupportedLocale,
      });

      expect(result.data.map((r) => r.movie.id)).toEqual([actingMovie.id]);
    });
  });

  describe('getFacets', () => {
    it('returns an empty list when the person has no credits', async () => {
      const person = await createTestPerson(testDb.db);

      const result = await service().getFacets({ personId: person.id });

      expect(result.departments).toEqual([]);
    });

    it('aggregates unique jobs per department, sorted', async () => {
      const person = await createTestPerson(testDb.db);
      const movieA = await createTestMovie(testDb.db);
      const movieB = await createTestMovie(testDb.db);
      const movieC = await createTestMovie(testDb.db);
      await addCredit(movieA.id, person.id, { department: 'Directing', job: 'Director' });
      await addCredit(movieB.id, person.id, { department: 'Acting', job: 'Actor' });
      await addCredit(movieC.id, person.id, { department: 'Acting', job: 'Stunt Double' });

      const result = await service().getFacets({ personId: person.id });

      expect(result.departments).toEqual([
        { department: 'Acting', jobs: ['Actor', 'Stunt Double'] },
        { department: 'Directing', jobs: ['Director'] },
      ]);
    });

    it('does not include credits from another person', async () => {
      const person = await createTestPerson(testDb.db);
      const other = await createTestPerson(testDb.db);
      const movie = await createTestMovie(testDb.db);
      await addCredit(movie.id, other.id, { department: 'Acting', job: 'Actor' });

      const result = await service().getFacets({ personId: person.id });

      expect(result.departments).toEqual([]);
    });
  });
});
