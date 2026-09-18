import { NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { bookmark, logTvEpisode, tmdbTvEpisode, tmdbTvSeason } from '@libs/db/schemas';
import {
  createFakeNotifyClient,
  createTestTvSeries,
  createTestUser,
  TestDatabase,
} from '@libs/testing';
import { RecoType } from '../../../../recos/dto/recos.dto';
import { LogTvStatus } from '../../../logs/tv-series-logs.dto';
import { User } from '../../../../auth/auth.service';
import type { RealtimeGateway } from '../../../../realtime/realtime.gateway';
import { LogServerEvents } from '@libs/realtime';

jest.mock('../../../../realtime/realtime.gateway', () => ({ RealtimeGateway: jest.fn() }));

const { TvEpisodeLogsService } =
  require('./tv-episode-logs.service') as typeof import('./tv-episode-logs.service');
const { TvLogsSyncService } =
  require('../../../logs/sync/tv-logs-sync.service') as typeof import('../../../logs/sync/tv-logs-sync.service');
const { RecosService } =
  require('../../../../recos/recos.service') as typeof import('../../../../recos/recos.service');
const { UserRecosService } =
  require('../../../../users/recos/user-recos.service') as typeof import('../../../../users/recos/user-recos.service');

function randomTmdbId(): number {
  return Math.floor(Math.random() * 1_000_000_000) + 1;
}

describe('TvEpisodeLogsService', () => {
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
    return new TvEpisodeLogsService(testDb.db, syncService, g);
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
        episodeNumber: 1,
      });

      expect(result).toBeNull();
    });

    it('returns the log once set', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db, { numberOfEpisodes: 1 });
      await addSeason(series.id, 1, 1);
      const service = buildService();
      await service.set({
        currentUser: asUser(user),
        tvSeriesId: series.id,
        seasonNumber: 1,
        episodeNumber: 1,
        dto: {},
      });

      const result = await service.get({
        currentUser: asUser(user),
        tvSeriesId: series.id,
        seasonNumber: 1,
        episodeNumber: 1,
      });

      expect(result?.episodeNumber).toBe(1);
    });
  });

  describe('set', () => {
    it('throws when the TMDB episode does not exist', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db);
      const service = buildService();

      await expect(
        service.set({
          currentUser: asUser(user),
          tvSeriesId: series.id,
          seasonNumber: 1,
          episodeNumber: 1,
          dto: {},
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates the series and season logs on first watch, and completes an active bookmark', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db, { numberOfEpisodes: 3 });
      await addSeason(series.id, 1, 3);
      await testDb.db
        .insert(bookmark)
        .values({
          userId: user.id,
          tvSeriesId: series.id,
          type: RecoType.TV_SERIES,
          status: 'active',
        });
      const service = buildService();

      const result = await service.set({
        currentUser: asUser(user),
        tvSeriesId: series.id,
        seasonNumber: 1,
        episodeNumber: 1,
        dto: {},
      });

      expect(result.series.status).toBe(LogTvStatus.WATCHING);
      expect(result.season.status).toBe(LogTvStatus.WATCHING);
      const b = await testDb.db.query.bookmark.findFirst({ where: eq(bookmark.userId, user.id) });
      expect(b?.status).toBe('completed');
    });

    it('watching every episode of a season auto-completes just that season, not the series', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db, { numberOfEpisodes: 5 });
      await addSeason(series.id, 1, 2);
      await addSeason(series.id, 2, 3);
      const service = buildService();

      await service.set({
        currentUser: asUser(user),
        tvSeriesId: series.id,
        seasonNumber: 1,
        episodeNumber: 1,
        dto: {},
      });
      const result = await service.set({
        currentUser: asUser(user),
        tvSeriesId: series.id,
        seasonNumber: 1,
        episodeNumber: 2,
        dto: {},
      });

      expect(result.season.status).toBe(LogTvStatus.COMPLETED);
      expect(result.series.status).toBe(LogTvStatus.WATCHING);
    });

    it('watching every episode of every season auto-completes the series', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db, { numberOfEpisodes: 3 });
      await addSeason(series.id, 1, 2);
      await addSeason(series.id, 2, 1);
      const service = buildService();

      await service.set({
        currentUser: asUser(user),
        tvSeriesId: series.id,
        seasonNumber: 1,
        episodeNumber: 1,
        dto: {},
      });
      await service.set({
        currentUser: asUser(user),
        tvSeriesId: series.id,
        seasonNumber: 1,
        episodeNumber: 2,
        dto: {},
      });
      const result = await service.set({
        currentUser: asUser(user),
        tvSeriesId: series.id,
        seasonNumber: 2,
        episodeNumber: 1,
        dto: {},
      });

      expect(result.season.status).toBe(LogTvStatus.COMPLETED);
      expect(result.series.status).toBe(LogTvStatus.COMPLETED);
    });

    it('watching a specials (season 0) episode does not count toward series completion', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db, { numberOfEpisodes: 1 });
      await addSeason(series.id, 0, 1);
      await addSeason(series.id, 1, 1);
      const service = buildService();

      const specialsResult = await service.set({
        currentUser: asUser(user),
        tvSeriesId: series.id,
        seasonNumber: 0,
        episodeNumber: 1,
        dto: {},
      });

      expect(specialsResult.season.status).toBe(LogTvStatus.COMPLETED);
      expect(specialsResult.series.status).toBe(LogTvStatus.WATCHING);
      expect(specialsResult.series.episodesWatchedCount).toBe(0);
    });

    it('re-watching (upserting) the same episode does not duplicate the log row', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db, { numberOfEpisodes: 1 });
      await addSeason(series.id, 1, 1);
      const service = buildService();

      await service.set({
        currentUser: asUser(user),
        tvSeriesId: series.id,
        seasonNumber: 1,
        episodeNumber: 1,
        dto: { rating: 5 },
      });
      await service.set({
        currentUser: asUser(user),
        tvSeriesId: series.id,
        seasonNumber: 1,
        episodeNumber: 1,
        dto: { rating: 8 },
      });

      const logs = await testDb.db.query.logTvEpisode.findMany({
        where: eq(logTvEpisode.seasonNumber, 1),
      });
      expect(logs).toHaveLength(1);
      expect(logs[0].rating).toBe(8);
    });

    it('broadcasts a TV_EPISODE_LOG_SET event', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db, { numberOfEpisodes: 1 });
      await addSeason(series.id, 1, 1);
      const gateway = fakeGateway();
      const service = buildService(gateway);

      await service.set({
        currentUser: asUser(user),
        tvSeriesId: series.id,
        seasonNumber: 1,
        episodeNumber: 1,
        dto: {},
      });

      expect(gateway.emitToUser).toHaveBeenCalledWith(
        user.id,
        LogServerEvents.TV_EPISODE_LOG_SET,
        expect.anything(),
      );
    });
  });

  describe('delete', () => {
    it('throws when there is no log to delete', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db);
      const service = buildService();

      await expect(
        service.delete({
          currentUser: asUser(user),
          tvSeriesId: series.id,
          seasonNumber: 1,
          episodeNumber: 1,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('un-completes a season/series after removing the episode that had completed it', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db, { numberOfEpisodes: 1 });
      await addSeason(series.id, 1, 1);
      const service = buildService();
      await service.set({
        currentUser: asUser(user),
        tvSeriesId: series.id,
        seasonNumber: 1,
        episodeNumber: 1,
        dto: {},
      });

      const result = await service.delete({
        currentUser: asUser(user),
        tvSeriesId: series.id,
        seasonNumber: 1,
        episodeNumber: 1,
      });

      expect(result.season.status).toBe(LogTvStatus.WATCHING);
      expect(result.series.status).toBe(LogTvStatus.WATCHING);
      expect(result.season.episodesWatchedCount).toBe(0);
    });

    it('broadcasts a TV_EPISODE_LOG_DELETED event', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db, { numberOfEpisodes: 1 });
      await addSeason(series.id, 1, 1);
      const gateway = fakeGateway();
      const service = buildService(gateway);
      await service.set({
        currentUser: asUser(user),
        tvSeriesId: series.id,
        seasonNumber: 1,
        episodeNumber: 1,
        dto: {},
      });

      await service.delete({
        currentUser: asUser(user),
        tvSeriesId: series.id,
        seasonNumber: 1,
        episodeNumber: 1,
      });

      expect(gateway.emitToUser).toHaveBeenCalledWith(
        user.id,
        LogServerEvents.TV_EPISODE_LOG_DELETED,
        expect.anything(),
      );
    });
  });
});
