import { tmdbTvEpisode, tmdbTvSeason } from '@libs/db/schemas';
import { createTestTvSeries, TestDatabase } from '@libs/testing';
import { defaultSupportedLocale } from '@libs/i18n';
import { SortOrder } from '../../../../common/dto/sort.dto';
import { TvEpisodeSortBy } from './tv-episodes.dto';
import { TvEpisodesService } from './tv-episodes.service';

function randomTmdbId(): number {
  return Math.floor(Math.random() * 1_000_000_000) + 1;
}

describe('TvEpisodesService', () => {
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

  const service = () => new TvEpisodesService(testDb.db);

  async function addSeason(tvSeriesId: number, seasonNumber: number) {
    const [season] = await testDb.db
      .insert(tmdbTvSeason)
      .values({
        id: randomTmdbId(),
        tvSeriesId,
        seasonNumber,
        episodeCount: 0,
        voteAverage: 0,
        voteCount: 0,
      })
      .returning();
    return season;
  }

  async function addEpisode(
    tvSeasonId: number,
    episodeNumber: number,
    overrides?: Partial<typeof tmdbTvEpisode.$inferInsert>,
  ) {
    const [ep] = await testDb.db
      .insert(tmdbTvEpisode)
      .values({ id: randomTmdbId(), tvSeasonId, episodeNumber, ...overrides })
      .returning();
    return ep;
  }

  describe('listAll', () => {
    it('returns an empty array when the season has no episodes', async () => {
      const series = await createTestTvSeries(testDb.db);
      await addSeason(series.id, 1);

      const result = await service().listAll({
        tvSeriesId: series.id,
        seasonNumber: 1,
        query: { sort_by: TvEpisodeSortBy.EPISODE_NUMBER, sort_order: SortOrder.ASC },
        locale: defaultSupportedLocale,
        currentUser: null,
      });

      expect(result).toEqual([]);
    });

    it('sorts by episode number ascending', async () => {
      const series = await createTestTvSeries(testDb.db);
      const season = await addSeason(series.id, 1);
      const ep2 = await addEpisode(season.id, 2);
      const ep1 = await addEpisode(season.id, 1);

      const result = await service().listAll({
        tvSeriesId: series.id,
        seasonNumber: 1,
        query: { sort_by: TvEpisodeSortBy.EPISODE_NUMBER, sort_order: SortOrder.ASC },
        locale: defaultSupportedLocale,
        currentUser: null,
      });

      expect(result.map((e) => e.id)).toEqual([ep1.id, ep2.id]);
    });

    it('sorts by air date descending', async () => {
      const series = await createTestTvSeries(testDb.db);
      const season = await addSeason(series.id, 1);
      const older = await addEpisode(season.id, 1, { airDate: '2020-01-01' });
      const newer = await addEpisode(season.id, 2, { airDate: '2021-01-01' });

      const result = await service().listAll({
        tvSeriesId: series.id,
        seasonNumber: 1,
        query: { sort_by: TvEpisodeSortBy.AIR_DATE, sort_order: SortOrder.DESC },
        locale: defaultSupportedLocale,
        currentUser: null,
      });

      expect(result.map((e) => e.id)).toEqual([newer.id, older.id]);
    });

    it('does not leak episodes from another season', async () => {
      const series = await createTestTvSeries(testDb.db);
      const season1 = await addSeason(series.id, 1);
      const season2 = await addSeason(series.id, 2);
      await addEpisode(season2.id, 1);

      const result = await service().listAll({
        tvSeriesId: series.id,
        seasonNumber: 1,
        query: { sort_by: TvEpisodeSortBy.EPISODE_NUMBER, sort_order: SortOrder.ASC },
        locale: defaultSupportedLocale,
        currentUser: null,
      });

      expect(result).toEqual([]);
      expect(season1).toBeDefined();
    });
  });

  describe('listPaginated', () => {
    it('reports accurate meta', async () => {
      const series = await createTestTvSeries(testDb.db);
      const season = await addSeason(series.id, 1);
      for (let i = 1; i <= 3; i++) await addEpisode(season.id, i);

      const result = await service().listPaginated({
        tvSeriesId: series.id,
        seasonNumber: 1,
        query: {
          page: 1,
          per_page: 2,
          sort_by: TvEpisodeSortBy.EPISODE_NUMBER,
          sort_order: SortOrder.ASC,
        },
        locale: defaultSupportedLocale,
        currentUser: null,
      });

      expect(result.data).toHaveLength(2);
      expect(result.meta).toEqual({
        total_results: 3,
        total_pages: 2,
        current_page: 1,
        per_page: 2,
      });
    });
  });

  describe('listInfinite', () => {
    it('paginates with a cursor until there is no next page', async () => {
      const series = await createTestTvSeries(testDb.db);
      const season = await addSeason(series.id, 1);
      const episodes = [];
      for (let i = 1; i <= 3; i++) episodes.push(await addEpisode(season.id, i));

      const firstPage = await service().listInfinite({
        tvSeriesId: series.id,
        seasonNumber: 1,
        query: { per_page: 2, sort_by: TvEpisodeSortBy.EPISODE_NUMBER, sort_order: SortOrder.ASC },
        locale: defaultSupportedLocale,
        currentUser: null,
      });
      expect(firstPage.data.map((e) => e.id)).toEqual([episodes[0].id, episodes[1].id]);
      expect(firstPage.meta.next_cursor).not.toBeNull();

      const secondPage = await service().listInfinite({
        tvSeriesId: series.id,
        seasonNumber: 1,
        query: {
          per_page: 2,
          sort_by: TvEpisodeSortBy.EPISODE_NUMBER,
          sort_order: SortOrder.ASC,
          cursor: firstPage.meta.next_cursor ?? undefined,
        },
        locale: defaultSupportedLocale,
        currentUser: null,
      });
      expect(secondPage.data.map((e) => e.id)).toEqual([episodes[2].id]);
      expect(secondPage.meta.next_cursor).toBeNull();
    });
  });
});
