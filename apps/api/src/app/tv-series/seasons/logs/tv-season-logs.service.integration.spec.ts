import { NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { bookmark, logTvEpisode, logTvSeason, tmdbTvEpisode, tmdbTvSeason } from '@libs/db/schemas';
import {
  createFakeNotifyClient,
  createTestTvSeries,
  createTestUser,
  TestDatabase,
} from '@libs/testing';
import { RecoType } from '../../../recos/dto/recos.dto';
import { LogTvStatus } from '../../logs/tv-series-logs.dto';
import { User } from '../../../auth/auth.service';
import type { RealtimeGateway } from '../../../realtime/realtime.gateway';
import { LogServerEvents } from '@libs/realtime';

jest.mock('../../../realtime/realtime.gateway', () => ({ RealtimeGateway: jest.fn() }));

const { TvSeasonLogsService } =
  require('./tv-season-logs.service') as typeof import('./tv-season-logs.service');
const { TvLogsSyncService } =
  require('../../logs/sync/tv-logs-sync.service') as typeof import('../../logs/sync/tv-logs-sync.service');
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

describe('TvSeasonLogsService', () => {
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
  const fakeGateway = () =>
    ({ emitToUser: jest.fn(), emitToUsers: jest.fn() }) as unknown as jest.Mocked<RealtimeGateway>;

  function buildService(gateway?: jest.Mocked<RealtimeGateway>) {
    const g = gateway ?? fakeGateway();
    const userRecosService = new UserRecosService(testDb.db);
    const recosService = new RecosService(testDb.db, createFakeNotifyClient(), g, userRecosService);
    const syncService = new TvLogsSyncService(testDb.db, recosService);
    return new TvSeasonLogsService(testDb.db, syncService, g);
  }

  async function addSeason(tvSeriesId: number, seasonNumber: number, episodeCount: number) {
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

  describe('get', () => {
    it('returns null when there is no log', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db);
      const service = buildService();

      const result = await service.get({
        currentUser: asUser(user),
        tvSeriesId: series.id,
        seasonNumber: 1,
      });

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('throws when the TMDB season does not exist', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db);
      const service = buildService();

      await expect(
        service.set({ currentUser: asUser(user), tvSeriesId: series.id, seasonNumber: 1, dto: {} }),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates the parent series log on first use and completes an active bookmark', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db, { numberOfEpisodes: 2 });
      await addSeason(series.id, 1, 2);
      await testDb.db
        .insert(bookmark)
        .values({
          userId: user.id,
          tvSeriesId: series.id,
          type: RecoType.TV_SERIES,
          status: 'active',
        });
      const service = buildService();

      await service.set({
        currentUser: asUser(user),
        tvSeriesId: series.id,
        seasonNumber: 1,
        dto: {},
      });

      const b = await testDb.db.query.bookmark.findFirst({ where: eq(bookmark.userId, user.id) });
      expect(b?.status).toBe('completed');
    });

    it('marking a season completed bulk-marks every episode as watched', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db, { numberOfEpisodes: 3 });
      await addSeason(series.id, 1, 3);
      const service = buildService();

      const result = await service.set({
        currentUser: asUser(user),
        tvSeriesId: series.id,
        seasonNumber: 1,
        dto: { status: LogTvStatus.COMPLETED },
      });

      expect(result.season.status).toBe(LogTvStatus.COMPLETED);
      expect(result.season.episodesWatchedCount).toBe(3);
    });

    it('completing the only season also completes the series', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db, { numberOfEpisodes: 2 });
      await addSeason(series.id, 1, 2);
      const service = buildService();

      const result = await service.set({
        currentUser: asUser(user),
        tvSeriesId: series.id,
        seasonNumber: 1,
        dto: { status: LogTvStatus.COMPLETED },
      });

      expect(result.series.status).toBe(LogTvStatus.COMPLETED);
    });

    it('completing one of two seasons leaves the series watching', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db, { numberOfEpisodes: 4 });
      await addSeason(series.id, 1, 2);
      await addSeason(series.id, 2, 2);
      const service = buildService();

      const result = await service.set({
        currentUser: asUser(user),
        tvSeriesId: series.id,
        seasonNumber: 1,
        dto: { status: LogTvStatus.COMPLETED },
      });

      expect(result.season.status).toBe(LogTvStatus.COMPLETED);
      expect(result.series.status).toBe(LogTvStatus.WATCHING);
    });

    it('completing every remaining season completes the series', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db, { numberOfEpisodes: 4 });
      await addSeason(series.id, 1, 2);
      await addSeason(series.id, 2, 2);
      const service = buildService();
      await service.set({
        currentUser: asUser(user),
        tvSeriesId: series.id,
        seasonNumber: 1,
        dto: { status: LogTvStatus.COMPLETED },
      });

      const result = await service.set({
        currentUser: asUser(user),
        tvSeriesId: series.id,
        seasonNumber: 2,
        dto: { status: LogTvStatus.COMPLETED },
      });

      expect(result.series.status).toBe(LogTvStatus.COMPLETED);
    });

    it('preserves an already-watched episode (rating kept) when later bulk-completing the season', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db, { numberOfEpisodes: 2 });
      const season = await addSeason(series.id, 1, 2);
      const service = buildService();
      // Manually seed a partial watch with a rating before completing the whole season.
      await testDb.db.transaction(async (tx) => {
        const syncService = new TvLogsSyncService(
          testDb.db,
          new RecosService(
            testDb.db,
            createFakeNotifyClient(),
            fakeGateway(),
            new UserRecosService(testDb.db),
          ),
        );
        const parents = await syncService.ensureParentsExist(tx, user.id, series.id, 1);
        await tx.insert(logTvEpisode).values({
          logTvSeriesId: parents.logTvSeriesId,
          logTvSeasonId: requireId(parents.logTvSeasonId),
          tvEpisodeId: season.episodes[0].id,
          seasonNumber: 1,
          episodeNumber: 1,
          rating: 9,
        });
      });

      await service.set({
        currentUser: asUser(user),
        tvSeriesId: series.id,
        seasonNumber: 1,
        dto: { status: LogTvStatus.COMPLETED },
      });

      const ep1 = await testDb.db.query.logTvEpisode.findFirst({
        where: eq(logTvEpisode.episodeNumber, 1),
      });
      expect(ep1?.rating).toBe(9);
    });

    it('keeps an explicit dropped status even though the underlying episode count is later completed by another call', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db, { numberOfEpisodes: 1 });
      await addSeason(series.id, 1, 1);
      const service = buildService();
      await service.set({
        currentUser: asUser(user),
        tvSeriesId: series.id,
        seasonNumber: 1,
        dto: { status: LogTvStatus.DROPPED },
      });

      const result = await service.set({
        currentUser: asUser(user),
        tvSeriesId: series.id,
        seasonNumber: 1,
        dto: { rating: 4 },
      });

      expect(result.season.status).toBe(LogTvStatus.DROPPED);
    });

    it('broadcasts a TV_SEASON_LOG_SET event', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db, { numberOfEpisodes: 1 });
      await addSeason(series.id, 1, 1);
      const gateway = fakeGateway();
      const service = buildService(gateway);

      await service.set({
        currentUser: asUser(user),
        tvSeriesId: series.id,
        seasonNumber: 1,
        dto: {},
      });

      expect(gateway.emitToUser).toHaveBeenCalledWith(
        user.id,
        LogServerEvents.TV_SEASON_LOG_SET,
        expect.anything(),
      );
    });
  });

  describe('delete', () => {
    it('throws when there is no season log', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db);
      const service = buildService();

      await expect(
        service.delete({ currentUser: asUser(user), tvSeriesId: series.id, seasonNumber: 1 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('cascades deleting the episode logs of that season', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db, { numberOfEpisodes: 2 });
      await addSeason(series.id, 1, 2);
      const service = buildService();
      await service.set({
        currentUser: asUser(user),
        tvSeriesId: series.id,
        seasonNumber: 1,
        dto: { status: LogTvStatus.COMPLETED },
      });

      await service.delete({ currentUser: asUser(user), tvSeriesId: series.id, seasonNumber: 1 });

      const remainingEpisodeLogs = await testDb.db.query.logTvEpisode.findMany({
        where: eq(logTvEpisode.seasonNumber, 1),
      });
      expect(remainingEpisodeLogs).toEqual([]);
      const remainingSeasonLog = await testDb.db.query.logTvSeason.findFirst({
        where: eq(logTvSeason.seasonNumber, 1),
      });
      expect(remainingSeasonLog).toBeUndefined();
    });

    it('un-completes the series after deleting the season that had completed it', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db, { numberOfEpisodes: 2 });
      await addSeason(series.id, 1, 2);
      const service = buildService();
      await service.set({
        currentUser: asUser(user),
        tvSeriesId: series.id,
        seasonNumber: 1,
        dto: { status: LogTvStatus.COMPLETED },
      });

      const result = await service.delete({
        currentUser: asUser(user),
        tvSeriesId: series.id,
        seasonNumber: 1,
      });

      expect(result.series.status).toBe(LogTvStatus.WATCHING);
      expect(result.series.episodesWatchedCount).toBe(0);
    });

    it('broadcasts a TV_SEASON_LOG_DELETED event', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db, { numberOfEpisodes: 1 });
      await addSeason(series.id, 1, 1);
      const gateway = fakeGateway();
      const service = buildService(gateway);
      await service.set({
        currentUser: asUser(user),
        tvSeriesId: series.id,
        seasonNumber: 1,
        dto: {},
      });

      await service.delete({ currentUser: asUser(user), tvSeriesId: series.id, seasonNumber: 1 });

      expect(gateway.emitToUser).toHaveBeenCalledWith(
        user.id,
        LogServerEvents.TV_SEASON_LOG_DELETED,
        expect.anything(),
      );
    });
  });
});
