import { tmdbTvSeriesCredit } from '@libs/db/schemas';
import { createTestPerson, createTestTvSeries, TestDatabase } from '@libs/testing';
import { defaultSupportedLocale } from '@libs/i18n';
import { TvSeriesSortBy } from '../../tv-series/dto/tv-series.dto';
import { SortOrder } from '../../../common/dto/sort.dto';
import { PersonTvSeriesService } from './person-tv-series.service';

function randomCreditId(): string {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

describe('PersonTvSeriesService', () => {
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

  const service = () => new PersonTvSeriesService(testDb.db);
  const baseQuery = { sort_by: TvSeriesSortBy.LAST_AIR_DATE, sort_order: SortOrder.DESC };

  async function addCredit(
    tvSeriesId: number,
    personId: number,
    overrides?: Partial<typeof tmdbTvSeriesCredit.$inferInsert>,
  ) {
    await testDb.db.insert(tmdbTvSeriesCredit).values({
      id: randomCreditId(),
      tvSeriesId,
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

    it('returns tv series the person has a credit on, with aggregated credits', async () => {
      const person = await createTestPerson(testDb.db);
      const tvSeries = await createTestTvSeries(testDb.db, { lastAirDate: '2020-01-01' });
      await addCredit(tvSeries.id, person.id, { department: 'Acting', job: 'Actor' });

      const result = await service().listPaginated({
        personId: person.id,
        query: { ...baseQuery, page: 1, per_page: 10 },
        locale: defaultSupportedLocale,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].tvSeries.id).toBe(tvSeries.id);
      expect(result.data[0].credits).toEqual([{ department: 'Acting', job: 'Actor' }]);
    });

    it('excludes tv series without a last air date', async () => {
      const person = await createTestPerson(testDb.db);
      const tvSeries = await createTestTvSeries(testDb.db, { lastAirDate: null });
      await addCredit(tvSeries.id, person.id);

      const result = await service().listPaginated({
        personId: person.id,
        query: { ...baseQuery, page: 1, per_page: 10 },
        locale: defaultSupportedLocale,
      });

      expect(result.data).toEqual([]);
    });

    it('does not leak tv series credited to another person', async () => {
      const person = await createTestPerson(testDb.db);
      const other = await createTestPerson(testDb.db);
      const tvSeries = await createTestTvSeries(testDb.db, { lastAirDate: '2020-01-01' });
      await addCredit(tvSeries.id, other.id);

      const result = await service().listPaginated({
        personId: person.id,
        query: { ...baseQuery, page: 1, per_page: 10 },
        locale: defaultSupportedLocale,
      });

      expect(result.data).toEqual([]);
    });

    it('lists a tv series only once even with multiple credits, aggregating all of them', async () => {
      const person = await createTestPerson(testDb.db);
      const tvSeries = await createTestTvSeries(testDb.db, { lastAirDate: '2020-01-01' });
      await addCredit(tvSeries.id, person.id, { department: 'Acting', job: 'Actor' });
      await addCredit(tvSeries.id, person.id, { department: 'Writing', job: 'Writer' });

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
      const actingSeries = await createTestTvSeries(testDb.db, { lastAirDate: '2020-01-01' });
      const directingSeries = await createTestTvSeries(testDb.db, { lastAirDate: '2020-01-01' });
      await addCredit(actingSeries.id, person.id, { department: 'Acting', job: 'Actor' });
      await addCredit(directingSeries.id, person.id, { department: 'Directing', job: 'Director' });

      const result = await service().listPaginated({
        personId: person.id,
        query: { ...baseQuery, page: 1, per_page: 10, department: 'Directing' },
        locale: defaultSupportedLocale,
      });

      expect(result.data.map((r) => r.tvSeries.id)).toEqual([directingSeries.id]);
    });

    it('filters by job', async () => {
      const person = await createTestPerson(testDb.db);
      const directorSeries = await createTestTvSeries(testDb.db, { lastAirDate: '2020-01-01' });
      const producerSeries = await createTestTvSeries(testDb.db, { lastAirDate: '2020-01-01' });
      await addCredit(directorSeries.id, person.id, { department: 'Directing', job: 'Director' });
      await addCredit(producerSeries.id, person.id, { department: 'Production', job: 'Producer' });

      const result = await service().listPaginated({
        personId: person.id,
        query: { ...baseQuery, page: 1, per_page: 10, job: 'Producer' },
        locale: defaultSupportedLocale,
      });

      expect(result.data.map((r) => r.tvSeries.id)).toEqual([producerSeries.id]);
    });

    it('sorts by last air date descending by default', async () => {
      const person = await createTestPerson(testDb.db);
      const older = await createTestTvSeries(testDb.db, { lastAirDate: '2010-01-01' });
      const newer = await createTestTvSeries(testDb.db, { lastAirDate: '2020-01-01' });
      await addCredit(older.id, person.id);
      await addCredit(newer.id, person.id);

      const result = await service().listPaginated({
        personId: person.id,
        query: { ...baseQuery, page: 1, per_page: 10 },
        locale: defaultSupportedLocale,
      });

      expect(result.data.map((r) => r.tvSeries.id)).toEqual([newer.id, older.id]);
    });

    it('paginates results and reports accurate meta', async () => {
      const person = await createTestPerson(testDb.db);
      for (let i = 0; i < 3; i++) {
        const tvSeries = await createTestTvSeries(testDb.db, { lastAirDate: `202${i}-01-01` });
        await addCredit(tvSeries.id, person.id);
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
      const seriesList = [];
      for (let i = 0; i < 3; i++) {
        const tvSeries = await createTestTvSeries(testDb.db, { lastAirDate: `202${i}-01-01` });
        await addCredit(tvSeries.id, person.id);
        seriesList.push(tvSeries);
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

      const allIds = [...firstPage.data, ...secondPage.data].map((r) => r.tvSeries.id).sort();
      expect(allIds).toEqual(seriesList.map((s) => s.id).sort());
    });

    it('paginates with a cursor when sorting by popularity', async () => {
      const person = await createTestPerson(testDb.db);
      const low = await createTestTvSeries(testDb.db, { lastAirDate: '2020-01-01', popularity: 1 });
      const high = await createTestTvSeries(testDb.db, {
        lastAirDate: '2020-01-01',
        popularity: 9,
      });
      await addCredit(low.id, person.id);
      await addCredit(high.id, person.id);

      const firstPage = await service().listInfinite({
        personId: person.id,
        query: { sort_by: TvSeriesSortBy.POPULARITY, sort_order: SortOrder.DESC, per_page: 1 },
        locale: defaultSupportedLocale,
      });
      expect(firstPage.data.map((r) => r.tvSeries.id)).toEqual([high.id]);
      expect(firstPage.meta.next_cursor).not.toBeNull();

      const secondPage = await service().listInfinite({
        personId: person.id,
        query: {
          sort_by: TvSeriesSortBy.POPULARITY,
          sort_order: SortOrder.DESC,
          per_page: 1,
          cursor: firstPage.meta.next_cursor ?? undefined,
        },
        locale: defaultSupportedLocale,
      });
      expect(secondPage.data.map((r) => r.tvSeries.id)).toEqual([low.id]);
      expect(secondPage.meta.next_cursor).toBeNull();
    });

    it('filters by department/job on the infinite list too', async () => {
      const person = await createTestPerson(testDb.db);
      const actingSeries = await createTestTvSeries(testDb.db, { lastAirDate: '2020-01-01' });
      const directingSeries = await createTestTvSeries(testDb.db, { lastAirDate: '2020-01-01' });
      await addCredit(actingSeries.id, person.id, { department: 'Acting', job: 'Actor' });
      await addCredit(directingSeries.id, person.id, { department: 'Directing', job: 'Director' });

      const result = await service().listInfinite({
        personId: person.id,
        query: { ...baseQuery, per_page: 10, department: 'Acting' },
        locale: defaultSupportedLocale,
      });

      expect(result.data.map((r) => r.tvSeries.id)).toEqual([actingSeries.id]);
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
      const seriesA = await createTestTvSeries(testDb.db);
      const seriesB = await createTestTvSeries(testDb.db);
      const seriesC = await createTestTvSeries(testDb.db);
      await addCredit(seriesA.id, person.id, { department: 'Directing', job: 'Director' });
      await addCredit(seriesB.id, person.id, { department: 'Acting', job: 'Actor' });
      await addCredit(seriesC.id, person.id, { department: 'Acting', job: 'Stunt Double' });

      const result = await service().getFacets({ personId: person.id });

      expect(result.departments).toEqual([
        { department: 'Acting', jobs: ['Actor', 'Stunt Double'] },
        { department: 'Directing', jobs: ['Director'] },
      ]);
    });

    it('does not include credits from another person', async () => {
      const person = await createTestPerson(testDb.db);
      const other = await createTestPerson(testDb.db);
      const tvSeries = await createTestTvSeries(testDb.db);
      await addCredit(tvSeries.id, other.id, { department: 'Acting', job: 'Actor' });

      const result = await service().getFacets({ personId: person.id });

      expect(result.departments).toEqual([]);
    });
  });
});
