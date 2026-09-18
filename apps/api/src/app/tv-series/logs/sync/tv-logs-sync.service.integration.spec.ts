import { eq } from 'drizzle-orm';
import {
  bookmark,
  logTvEpisode,
  logTvSeason,
  logTvSeries,
  reco,
  tmdbTvEpisode,
  tmdbTvSeason,
} from '@libs/db/schemas';
import {
  createFakeNotifyClient,
  createTestTvSeries,
  createTestUser,
  TestDatabase,
} from '@libs/testing';
import { RecoType } from '../../../recos/dto/recos.dto';
import { LogTvStatus } from '../tv-series-logs.dto';
import type { RealtimeGateway } from '../../../realtime/realtime.gateway';

jest.mock('../../../realtime/realtime.gateway', () => ({ RealtimeGateway: jest.fn() }));

const { TvLogsSyncService } =
  require('./tv-logs-sync.service') as typeof import('./tv-logs-sync.service');
const { RecosService } =
  require('../../../recos/recos.service') as typeof import('../../../recos/recos.service');
const { UserRecosService } =
  require('../../../users/recos/user-recos.service') as typeof import('../../../users/recos/user-recos.service');

function randomTmdbId(): number {
  return Math.floor(Math.random() * 1_000_000_000) + 1;
}

function requireId(value: number | null): number {
  if (value === null) throw new Error('Expected a non-null id');
  return value;
}

describe('TvLogsSyncService', () => {
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

  const fakeGateway = () =>
    ({ emitToUser: jest.fn(), emitToUsers: jest.fn() }) as unknown as jest.Mocked<RealtimeGateway>;

  function buildService() {
    const gateway = fakeGateway();
    const userRecosService = new UserRecosService(testDb.db);
    const recosService = new RecosService(
      testDb.db,
      createFakeNotifyClient(),
      gateway,
      userRecosService,
    );
    return new TvLogsSyncService(testDb.db, recosService);
  }

  async function addSeason(
    tvSeriesId: number,
    seasonNumber: number,
    episodeCount: number,
  ): Promise<{ id: number; episodes: { id: number; episodeNumber: number }[] }> {
    const [season] = await testDb.db
      .insert(tmdbTvSeason)
      .values({
        id: randomTmdbId(),
        tvSeriesId,
        seasonNumber,
        episodeCount,
        voteAverage: 0,
        voteCount: 0,
      })
      .returning();
    const episodes = [];
    for (let e = 1; e <= episodeCount; e++) {
      const [ep] = await testDb.db
        .insert(tmdbTvEpisode)
        .values({ id: randomTmdbId(), tvSeasonId: season.id, episodeNumber: e })
        .returning();
      episodes.push(ep);
    }
    return { id: season.id, episodes };
  }

  describe('ensureParentsExist', () => {
    it('creates a new watching series log when none exists', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db);
      const service = buildService();

      const result = await testDb.db.transaction((tx) =>
        service.ensureParentsExist(tx, user.id, series.id),
      );

      expect(result.isNewSeriesLog).toBe(true);
      const log = await testDb.db.query.logTvSeries.findFirst({
        where: eq(logTvSeries.id, result.logTvSeriesId),
      });
      expect(log?.status).toBe('watching');
    });

    it('is idempotent: a second call reuses the same series log and reports isNewSeriesLog=false', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db);
      const service = buildService();

      const first = await testDb.db.transaction((tx) =>
        service.ensureParentsExist(tx, user.id, series.id),
      );
      const second = await testDb.db.transaction((tx) =>
        service.ensureParentsExist(tx, user.id, series.id),
      );

      expect(second.logTvSeriesId).toBe(first.logTvSeriesId);
      expect(second.isNewSeriesLog).toBe(false);
      const allLogs = await testDb.db.query.logTvSeries.findMany({
        where: eq(logTvSeries.tvSeriesId, series.id),
      });
      expect(allLogs).toHaveLength(1);
    });

    it('completes an active bookmark for the series on first creation only', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db);
      await testDb.db
        .insert(bookmark)
        .values({
          userId: user.id,
          tvSeriesId: series.id,
          type: RecoType.TV_SERIES,
          status: 'active',
        });
      const service = buildService();

      await testDb.db.transaction((tx) => service.ensureParentsExist(tx, user.id, series.id));

      const b = await testDb.db.query.bookmark.findFirst({ where: eq(bookmark.userId, user.id) });
      expect(b?.status).toBe('completed');
    });

    it('completes an active reco for the series on first creation only', async () => {
      const { user } = await createTestUser(testDb.db);
      const { user: sender } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db);
      await testDb.db.insert(reco).values({
        userId: user.id,
        senderId: sender.id,
        tvSeriesId: series.id,
        type: RecoType.TV_SERIES,
        status: 'active',
      });
      const service = buildService();

      await testDb.db.transaction((tx) => service.ensureParentsExist(tx, user.id, series.id));

      const r = await testDb.db.query.reco.findFirst({ where: eq(reco.userId, user.id) });
      expect(r?.status).toBe('completed');
    });

    it('does not touch a bookmark created after the series log already existed', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db);
      const service = buildService();
      await testDb.db.transaction((tx) => service.ensureParentsExist(tx, user.id, series.id));

      await testDb.db
        .insert(bookmark)
        .values({
          userId: user.id,
          tvSeriesId: series.id,
          type: RecoType.TV_SERIES,
          status: 'active',
        });
      await testDb.db.transaction((tx) => service.ensureParentsExist(tx, user.id, series.id));

      const b = await testDb.db.query.bookmark.findFirst({ where: eq(bookmark.userId, user.id) });
      expect(b?.status).toBe('active');
    });

    it('creates the season log when the season exists in TMDB', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db);
      await addSeason(series.id, 1, 5);
      const service = buildService();

      const result = await testDb.db.transaction((tx) =>
        service.ensureParentsExist(tx, user.id, series.id, 1),
      );

      expect(result.logTvSeasonId).not.toBeNull();
      const season = await testDb.db.query.logTvSeason.findFirst({
        where: eq(logTvSeason.id, requireId(result.logTvSeasonId)),
      });
      expect(season?.seasonNumber).toBe(1);
      expect(season?.status).toBe('watching');
    });

    it('returns a null season id when the season does not exist in TMDB', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db);
      const service = buildService();

      const result = await testDb.db.transaction((tx) =>
        service.ensureParentsExist(tx, user.id, series.id, 99),
      );

      expect(result.logTvSeasonId).toBeNull();
      // The series log itself is still created even though the season wasn't found.
      const log = await testDb.db.query.logTvSeries.findFirst({
        where: eq(logTvSeries.tvSeriesId, series.id),
      });
      expect(log).toBeDefined();
    });

    it('is idempotent for the season log across repeated calls', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db);
      await addSeason(series.id, 1, 5);
      const service = buildService();

      const first = await testDb.db.transaction((tx) =>
        service.ensureParentsExist(tx, user.id, series.id, 1),
      );
      const second = await testDb.db.transaction((tx) =>
        service.ensureParentsExist(tx, user.id, series.id, 1),
      );

      expect(second.logTvSeasonId).toBe(first.logTvSeasonId);
      const allSeasons = await testDb.db.query.logTvSeason.findMany({
        where: eq(logTvSeason.logTvSeriesId, first.logTvSeriesId),
      });
      expect(allSeasons).toHaveLength(1);
    });
  });

  describe('syncTree', () => {
    it('returns nulls when there is no series log', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db);
      const service = buildService();

      const result = await testDb.db.transaction((tx) => service.syncTree(tx, user.id, series.id));

      expect(result).toEqual({ series: null, season: null });
    });

    it('recomputes episode counts for the season and series from actual episode logs', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db, { numberOfEpisodes: 5 });
      const season1 = await addSeason(series.id, 1, 3);
      await addSeason(series.id, 2, 2);
      const service = buildService();

      const parents = await testDb.db.transaction((tx) =>
        service.ensureParentsExist(tx, user.id, series.id, 1),
      );
      await testDb.db.insert(logTvEpisode).values([
        {
          logTvSeriesId: parents.logTvSeriesId,
          logTvSeasonId: requireId(parents.logTvSeasonId),
          tvEpisodeId: season1.episodes[0].id,
          seasonNumber: 1,
          episodeNumber: 1,
        },
        {
          logTvSeriesId: parents.logTvSeriesId,
          logTvSeasonId: requireId(parents.logTvSeasonId),
          tvEpisodeId: season1.episodes[1].id,
          seasonNumber: 1,
          episodeNumber: 2,
        },
      ]);

      const result = await testDb.db.transaction((tx) =>
        service.syncTree(tx, user.id, series.id, 1),
      );

      expect(result.season?.episodesWatchedCount).toBe(2);
      expect(result.series?.episodesWatchedCount).toBe(2);
    });

    it('excludes season 0 (specials) from the series total but still tracks it at the season level', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db, { numberOfEpisodes: 1 });
      const specials = await addSeason(series.id, 0, 2);
      const season1 = await addSeason(series.id, 1, 1);
      const service = buildService();

      const specialsParents = await testDb.db.transaction((tx) =>
        service.ensureParentsExist(tx, user.id, series.id, 0),
      );
      await testDb.db.insert(logTvEpisode).values({
        logTvSeriesId: specialsParents.logTvSeriesId,
        logTvSeasonId: requireId(specialsParents.logTvSeasonId),
        tvEpisodeId: specials.episodes[0].id,
        seasonNumber: 0,
        episodeNumber: 1,
      });
      const s1Parents = await testDb.db.transaction((tx) =>
        service.ensureParentsExist(tx, user.id, series.id, 1),
      );
      await testDb.db.insert(logTvEpisode).values({
        logTvSeriesId: s1Parents.logTvSeriesId,
        logTvSeasonId: requireId(s1Parents.logTvSeasonId),
        tvEpisodeId: season1.episodes[0].id,
        seasonNumber: 1,
        episodeNumber: 1,
      });

      const specialsResult = await testDb.db.transaction((tx) =>
        service.syncTree(tx, user.id, series.id, 0),
      );
      expect(specialsResult.season?.episodesWatchedCount).toBe(1);
      // Series total only counts season 1's single watched episode, not the special.
      expect(specialsResult.series?.episodesWatchedCount).toBe(1);
    });

    it('derives COMPLETED status once episodesWatchedCount reaches the total, for both season and series', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db, { numberOfEpisodes: 1 });
      const season1 = await addSeason(series.id, 1, 1);
      const service = buildService();

      const parents = await testDb.db.transaction((tx) =>
        service.ensureParentsExist(tx, user.id, series.id, 1),
      );
      await testDb.db.insert(logTvEpisode).values({
        logTvSeriesId: parents.logTvSeriesId,
        logTvSeasonId: requireId(parents.logTvSeasonId),
        tvEpisodeId: season1.episodes[0].id,
        seasonNumber: 1,
        episodeNumber: 1,
      });

      const result = await testDb.db.transaction((tx) =>
        service.syncTree(tx, user.id, series.id, 1),
      );

      expect(result.season?.status).toBe(LogTvStatus.COMPLETED);
      expect(result.series?.status).toBe(LogTvStatus.COMPLETED);
    });

    it('never derives COMPLETED when the underlying status is dropped, even at 100%', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db, { numberOfEpisodes: 1 });
      const season1 = await addSeason(series.id, 1, 1);
      const service = buildService();

      const parents = await testDb.db.transaction((tx) =>
        service.ensureParentsExist(tx, user.id, series.id, 1),
      );
      await testDb.db.insert(logTvEpisode).values({
        logTvSeriesId: parents.logTvSeriesId,
        logTvSeasonId: requireId(parents.logTvSeasonId),
        tvEpisodeId: season1.episodes[0].id,
        seasonNumber: 1,
        episodeNumber: 1,
      });
      await testDb.db
        .update(logTvSeries)
        .set({ status: 'dropped' })
        .where(eq(logTvSeries.id, parents.logTvSeriesId));
      await testDb.db
        .update(logTvSeason)
        .set({ status: 'dropped' })
        .where(eq(logTvSeason.id, requireId(parents.logTvSeasonId)));

      const result = await testDb.db.transaction((tx) =>
        service.syncTree(tx, user.id, series.id, 1),
      );

      expect(result.season?.status).toBe('dropped');
      expect(result.series?.status).toBe('dropped');
    });

    it('returns a null season when no seasonNumber is provided', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db);
      const service = buildService();
      await testDb.db.transaction((tx) => service.ensureParentsExist(tx, user.id, series.id, 1));

      const result = await testDb.db.transaction((tx) => service.syncTree(tx, user.id, series.id));

      expect(result.season).toBeNull();
      expect(result.series).not.toBeNull();
    });
  });
});
