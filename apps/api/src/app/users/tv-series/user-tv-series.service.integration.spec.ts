import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { follow, logTvSeries } from '@libs/db/schemas';
import { createTestTvSeries, createTestUser, TestDatabase } from '@libs/testing';
import { defaultSupportedLocale } from '@libs/i18n';
import { User } from '../../auth/auth.service';
import { LogTvSeriesSortBy } from '../../tv-series/logs/tv-series-logs.dto';
import { SortOrder } from '../../../common/dto/sort.dto';
import { UserTvSeriesService } from './user-tv-series.service';

describe('UserTvSeriesService', () => {
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
  const service = () => new UserTvSeriesService(testDb.db);
  const baseQuery = { sort_by: LogTvSeriesSortBy.UPDATED_AT, sort_order: SortOrder.DESC };

  describe('get', () => {
    it('throws when the target user does not exist', async () => {
      const series = await createTestTvSeries(testDb.db);

      await expect(
        service().get({
          userId: '00000000-0000-0000-0000-000000000000',
          tvSeriesId: series.id,
          currentUser: null,
          locale: defaultSupportedLocale,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('blocks an anonymous viewer from a private account log', async () => {
      const { user } = await createTestUser(testDb.db, { profile: { isPrivate: true } });
      const series = await createTestTvSeries(testDb.db);
      await testDb.db.insert(logTvSeries).values({ userId: user.id, tvSeriesId: series.id });

      await expect(
        service().get({
          userId: user.id,
          tvSeriesId: series.id,
          currentUser: null,
          locale: defaultSupportedLocale,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows an accepted follower to see a private account log', async () => {
      const { user } = await createTestUser(testDb.db, { profile: { isPrivate: true } });
      const { user: follower } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db);
      await testDb.db.insert(logTvSeries).values({ userId: user.id, tvSeriesId: series.id });
      await testDb.db
        .insert(follow)
        .values({ followerId: follower.id, followingId: user.id, status: 'accepted' });

      const result = await service().get({
        userId: user.id,
        tvSeriesId: series.id,
        currentUser: asUser(follower),
        locale: defaultSupportedLocale,
      });

      expect(result?.tvSeries.id).toBe(series.id);
    });

    it('returns null when there is no log (but the profile is visible)', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db);

      const result = await service().get({
        userId: user.id,
        tvSeriesId: series.id,
        currentUser: null,
        locale: defaultSupportedLocale,
      });

      expect(result).toBeNull();
    });
  });

  describe('listPaginated', () => {
    it('silently omits a private account tv-series logs from a stranger (empty, not an error)', async () => {
      const { user } = await createTestUser(testDb.db, { profile: { isPrivate: true } });
      const { user: stranger } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db);
      await testDb.db.insert(logTvSeries).values({ userId: user.id, tvSeriesId: series.id });

      const result = await service().listPaginated({
        userId: user.id,
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: asUser(stranger),
        locale: defaultSupportedLocale,
      });

      expect(result.data).toEqual([]);
    });

    it('includes a private account tv-series logs for an accepted follower', async () => {
      const { user } = await createTestUser(testDb.db, { profile: { isPrivate: true } });
      const { user: follower } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db);
      await testDb.db.insert(logTvSeries).values({ userId: user.id, tvSeriesId: series.id });
      await testDb.db
        .insert(follow)
        .values({ followerId: follower.id, followingId: user.id, status: 'accepted' });

      const result = await service().listPaginated({
        userId: user.id,
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: asUser(follower),
        locale: defaultSupportedLocale,
      });

      expect(result.data.map((r) => r.tvSeries.id)).toEqual([series.id]);
    });

    it('lists the user own tv-series logs, most recently updated first', async () => {
      const { user } = await createTestUser(testDb.db);
      const older = await createTestTvSeries(testDb.db);
      const newer = await createTestTvSeries(testDb.db);
      await testDb.db.insert(logTvSeries).values({ userId: user.id, tvSeriesId: older.id });
      await testDb.db.insert(logTvSeries).values({ userId: user.id, tvSeriesId: newer.id });

      const result = await service().listPaginated({
        userId: user.id,
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: null,
        locale: defaultSupportedLocale,
      });

      expect(result.data.map((r) => r.tvSeries.id)).toEqual([newer.id, older.id]);
    });

    it('does not leak logs from another user', async () => {
      const { user: a } = await createTestUser(testDb.db);
      const { user: b } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db);
      await testDb.db.insert(logTvSeries).values({ userId: b.id, tvSeriesId: series.id });

      const result = await service().listPaginated({
        userId: a.id,
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: null,
        locale: defaultSupportedLocale,
      });

      expect(result.data).toEqual([]);
    });

    it('paginates results and reports accurate meta', async () => {
      const { user } = await createTestUser(testDb.db);
      for (let i = 0; i < 3; i++) {
        const series = await createTestTvSeries(testDb.db);
        await testDb.db.insert(logTvSeries).values({ userId: user.id, tvSeriesId: series.id });
      }

      const page1 = await service().listPaginated({
        userId: user.id,
        query: { ...baseQuery, page: 1, per_page: 2 },
        currentUser: null,
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
      for (let i = 0; i < 3; i++) {
        const series = await createTestTvSeries(testDb.db);
        await testDb.db.insert(logTvSeries).values({ userId: user.id, tvSeriesId: series.id });
      }

      const firstPage = await service().listInfinite({
        userId: user.id,
        query: { ...baseQuery, per_page: 2 },
        currentUser: null,
        locale: defaultSupportedLocale,
      });
      expect(firstPage.data).toHaveLength(2);
      expect(firstPage.meta.next_cursor).not.toBeNull();

      const secondPage = await service().listInfinite({
        userId: user.id,
        query: { ...baseQuery, per_page: 2, cursor: firstPage.meta.next_cursor ?? undefined },
        currentUser: null,
        locale: defaultSupportedLocale,
      });
      expect(secondPage.data).toHaveLength(1);
      expect(secondPage.meta.next_cursor).toBeNull();
    });
  });
});
