import { NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import {
  bookmark,
  follow,
  logTvEpisode,
  logTvSeason,
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
import { RecoType } from '../../recos/dto/recos.dto';
import { LogTvStatus } from './tv-series-logs.dto';
import { User } from '../../auth/auth.service';
import type { RealtimeGateway } from '../../realtime/realtime.gateway';
import { LogServerEvents } from '@libs/realtime';

jest.mock('../../realtime/realtime.gateway', () => ({ RealtimeGateway: jest.fn() }));

const { TvSeriesLogsService } =
  require('./tv-series-logs.service') as typeof import('./tv-series-logs.service');
const { TvLogsSyncService } =
  require('./sync/tv-logs-sync.service') as typeof import('./sync/tv-logs-sync.service');
const { RecosService } =
  require('../../recos/recos.service') as typeof import('../../recos/recos.service');
const { UserRecosService } =
  require('../../users/recos/user-recos.service') as typeof import('../../users/recos/user-recos.service');

function randomTmdbId(): number {
  return Math.floor(Math.random() * 1_000_000_000) + 1;
}

function requireId(value: number | null): number {
  if (value === null) throw new Error('Expected a non-null id');
  return value;
}

describe('TvSeriesLogsService', () => {
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
    return new TvSeriesLogsService(testDb.db, syncService, g, recosService);
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

      expect(await service.get({ currentUser: asUser(user), tvSeriesId: series.id })).toBeNull();
    });

    it('derives COMPLETED once episodesWatchedCount reaches the total', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db, { numberOfEpisodes: 1 });
      await addSeason(series.id, 1, 1);
      const service = buildService();
      await service.set({
        currentUser: asUser(user),
        tvSeriesId: series.id,
        dto: { status: LogTvStatus.COMPLETED },
      });

      const result = await service.get({ currentUser: asUser(user), tvSeriesId: series.id });

      expect(result?.status).toBe(LogTvStatus.COMPLETED);
    });
  });

  describe('set', () => {
    it('throws when the TMDB series does not exist', async () => {
      const { user } = await createTestUser(testDb.db);
      const service = buildService();

      await expect(
        service.set({ currentUser: asUser(user), tvSeriesId: 999999, dto: {} }),
      ).rejects.toThrow(NotFoundException);
    });

    it('completes an active bookmark when the series log is created for the first time', async () => {
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

      await service.set({ currentUser: asUser(user), tvSeriesId: series.id, dto: {} });

      const b = await testDb.db.query.bookmark.findFirst({ where: eq(bookmark.userId, user.id) });
      expect(b?.status).toBe('completed');
    });

    it('completes an active reco when the series log is created for the first time', async () => {
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

      await service.set({ currentUser: asUser(user), tvSeriesId: series.id, dto: {} });

      const r = await testDb.db.query.reco.findFirst({ where: eq(reco.userId, user.id) });
      expect(r?.status).toBe('completed');
    });

    it('does not re-touch a bookmark created after the log already existed', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db);
      const service = buildService();
      await service.set({ currentUser: asUser(user), tvSeriesId: series.id, dto: {} });

      await testDb.db
        .insert(bookmark)
        .values({
          userId: user.id,
          tvSeriesId: series.id,
          type: RecoType.TV_SERIES,
          status: 'active',
        });
      await service.set({ currentUser: asUser(user), tvSeriesId: series.id, dto: { rating: 7 } });

      const b = await testDb.db.query.bookmark.findFirst({ where: eq(bookmark.userId, user.id) });
      expect(b?.status).toBe('active');
    });

    it('marking the series completed bulk-marks every season and episode as watched', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db, { numberOfEpisodes: 5 });
      await addSeason(series.id, 1, 2);
      await addSeason(series.id, 2, 3);
      const service = buildService();

      const result = await service.set({
        currentUser: asUser(user),
        tvSeriesId: series.id,
        dto: { status: LogTvStatus.COMPLETED },
      });

      expect(result.status).toBe(LogTvStatus.COMPLETED);
      expect(result.episodesWatchedCount).toBe(5);
      const seasonLogs = await testDb.db.query.logTvSeason.findMany({
        where: eq(logTvSeason.logTvSeriesId, result.id),
      });
      expect(seasonLogs).toHaveLength(2);
      const bySeasonNumber = new Map(
        seasonLogs.map((s) => [s.seasonNumber, s.episodesWatchedCount]),
      );
      expect(bySeasonNumber.get(1)).toBe(2);
      expect(bySeasonNumber.get(2)).toBe(3);
      const episodeLogs = await testDb.db.query.logTvEpisode.findMany({
        where: eq(logTvEpisode.logTvSeriesId, result.id),
      });
      expect(episodeLogs).toHaveLength(5);
    });

    it('excludes specials (season 0) when bulk-marking the series completed', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db, { numberOfEpisodes: 1 });
      await addSeason(series.id, 0, 2);
      await addSeason(series.id, 1, 1);
      const service = buildService();

      const result = await service.set({
        currentUser: asUser(user),
        tvSeriesId: series.id,
        dto: { status: LogTvStatus.COMPLETED },
      });

      expect(result.status).toBe(LogTvStatus.COMPLETED);
      const seasonLogs = await testDb.db.query.logTvSeason.findMany({
        where: eq(logTvSeason.logTvSeriesId, result.id),
      });
      expect(seasonLogs.map((s) => s.seasonNumber).sort()).toEqual([1]);
    });

    it('preserves an already-rated episode when later bulk-completing the whole series', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db, { numberOfEpisodes: 2 });
      const season = await addSeason(series.id, 1, 2);
      const service = buildService();
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
          rating: 10,
        });
      });

      await service.set({
        currentUser: asUser(user),
        tvSeriesId: series.id,
        dto: { status: LogTvStatus.COMPLETED },
      });

      const ep1 = await testDb.db.query.logTvEpisode.findFirst({
        where: eq(logTvEpisode.episodeNumber, 1),
      });
      expect(ep1?.rating).toBe(10);
    });

    it('does not derive COMPLETED when the status is dropped, even at 100% watched', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db, { numberOfEpisodes: 1 });
      await addSeason(series.id, 1, 1);
      const service = buildService();
      await service.set({
        currentUser: asUser(user),
        tvSeriesId: series.id,
        dto: { status: LogTvStatus.COMPLETED },
      });

      const result = await service.set({
        currentUser: asUser(user),
        tvSeriesId: series.id,
        dto: { status: LogTvStatus.DROPPED },
      });

      expect(result.status).toBe(LogTvStatus.DROPPED);
    });

    it('broadcasts a TV_SERIES_LOG_SET event', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db);
      const gateway = fakeGateway();
      const service = buildService(gateway);

      await service.set({ currentUser: asUser(user), tvSeriesId: series.id, dto: {} });

      expect(gateway.emitToUser).toHaveBeenCalledWith(
        user.id,
        LogServerEvents.TV_SERIES_LOG_SET,
        expect.anything(),
      );
    });
  });

  describe('delete', () => {
    it('throws when there is no log', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db);
      const service = buildService();

      await expect(
        service.delete({ currentUser: asUser(user), tvSeriesId: series.id }),
      ).rejects.toThrow(NotFoundException);
    });

    it('cascades deleting season and episode logs', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db, { numberOfEpisodes: 2 });
      await addSeason(series.id, 1, 2);
      const service = buildService();
      await service.set({
        currentUser: asUser(user),
        tvSeriesId: series.id,
        dto: { status: LogTvStatus.COMPLETED },
      });

      await service.delete({ currentUser: asUser(user), tvSeriesId: series.id });

      const seasonLogs = await testDb.db.query.logTvSeason.findMany({
        where: eq(logTvSeason.seasonNumber, 1),
      });
      expect(seasonLogs).toEqual([]);
      const episodeLogs = await testDb.db.query.logTvEpisode.findMany({
        where: eq(logTvEpisode.seasonNumber, 1),
      });
      expect(episodeLogs).toEqual([]);
    });

    it('broadcasts a TV_SERIES_LOG_DELETED event', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db);
      const gateway = fakeGateway();
      const service = buildService(gateway);
      await service.set({ currentUser: asUser(user), tvSeriesId: series.id, dto: {} });

      await service.delete({ currentUser: asUser(user), tvSeriesId: series.id });

      expect(gateway.emitToUser).toHaveBeenCalledWith(
        user.id,
        LogServerEvents.TV_SERIES_LOG_DELETED,
        expect.anything(),
      );
    });
  });

  describe('following logs', () => {
    it('lists logs only from accepted follows, and can filter to rated ones', async () => {
      const { user: viewer } = await createTestUser(testDb.db);
      const { user: followed } = await createTestUser(testDb.db);
      const { user: notFollowed } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db);
      await testDb.db
        .insert(follow)
        .values({ followerId: viewer.id, followingId: followed.id, status: 'accepted' });
      const service = buildService();
      await service.set({
        currentUser: asUser(followed),
        tvSeriesId: series.id,
        dto: { rating: 8 },
      });
      await service.set({ currentUser: asUser(notFollowed), tvSeriesId: series.id, dto: {} });

      const result = await service.getFollowingLogs({
        currentUser: asUser(viewer),
        tvSeriesId: series.id,
        dto: {},
      });

      expect(result.map((r) => r.userId)).toEqual([followed.id]);
    });

    it('computes the average rating across accepted follows only', async () => {
      const { user: viewer } = await createTestUser(testDb.db);
      const { user: followedA } = await createTestUser(testDb.db);
      const { user: followedB } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db);
      await testDb.db.insert(follow).values([
        { followerId: viewer.id, followingId: followedA.id, status: 'accepted' },
        { followerId: viewer.id, followingId: followedB.id, status: 'accepted' },
      ]);
      const service = buildService();
      await service.set({
        currentUser: asUser(followedA),
        tvSeriesId: series.id,
        dto: { rating: 6 },
      });
      await service.set({
        currentUser: asUser(followedB),
        tvSeriesId: series.id,
        dto: { rating: 10 },
      });

      const result = await service.getFollowingAverageRating({
        currentUser: asUser(viewer),
        tvSeriesId: series.id,
      });

      expect(result.averageRating).toBe(8);
    });

    it('returns a null average rating when nobody followed has rated it', async () => {
      const { user: viewer } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db);
      const service = buildService();

      const result = await service.getFollowingAverageRating({
        currentUser: asUser(viewer),
        tvSeriesId: series.id,
      });

      expect(result.averageRating).toBeNull();
    });
  });
});
