import { and, eq } from 'drizzle-orm';
import { playlistItem, playlistMember } from '@libs/db/schemas';
import {
  createTestPlaylist,
  createTestTvSeries,
  createTestUser,
  TestDatabase,
} from '@libs/testing';
import { User } from '../../auth/auth.service';
import { PlaylistSortBy } from '../../playlists/dto/playlists.dto';
import { SortOrder } from '../../../common/dto/sort.dto';
import { TvSeriesPlaylistsService } from './tv-series-playlists.service';

describe('TvSeriesPlaylistsService', () => {
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
  const service = () => new TvSeriesPlaylistsService(testDb.db);
  const baseQuery = { sort_by: PlaylistSortBy.CREATED_AT, sort_order: SortOrder.ASC };

  async function addTvSeriesToPlaylist(
    playlistId: number,
    userId: string,
    tvSeriesId: number,
    rank = 'a0',
  ) {
    await testDb.db
      .insert(playlistItem)
      .values({ playlistId, userId, tvSeriesId, type: 'tv_series', rank });
  }

  describe('listPaginated', () => {
    it('only lists playlists that actually contain the tv series', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db);
      const otherSeries = await createTestTvSeries(testDb.db);
      const withSeries = await createTestPlaylist(
        testDb.db,
        { userId: user.id },
        { visibility: 'public' },
      );
      const withoutSeries = await createTestPlaylist(
        testDb.db,
        { userId: user.id },
        { visibility: 'public' },
      );
      await addTvSeriesToPlaylist(withSeries.id, user.id, series.id);
      await addTvSeriesToPlaylist(withoutSeries.id, user.id, otherSeries.id);

      const result = await service().listPaginated({
        tvSeriesId: series.id,
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: null,
      });

      expect(result.data.map((p) => p.id)).toEqual([withSeries.id]);
    });

    it('hides a private playlist containing the series from a non-member', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: viewer } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db);
      const p = await createTestPlaylist(
        testDb.db,
        { userId: owner.id },
        { visibility: 'private' },
      );
      await addTvSeriesToPlaylist(p.id, owner.id, series.id);

      const result = await service().listPaginated({
        tvSeriesId: series.id,
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: asUser(viewer),
      });

      expect(result.data).toEqual([]);
    });

    it('shows a private playlist containing the series to a member', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: member } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db);
      const p = await createTestPlaylist(
        testDb.db,
        { userId: owner.id },
        { visibility: 'private' },
      );
      await addTvSeriesToPlaylist(p.id, owner.id, series.id);
      await testDb.db
        .insert(playlistMember)
        .values({ playlistId: p.id, userId: member.id, role: 'viewer' });

      const result = await service().listPaginated({
        tvSeriesId: series.id,
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: asUser(member),
      });

      expect(result.data.map((p) => p.id)).toEqual([p.id]);
    });

    it('stops listing a playlist once the tv series is removed from it', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: user.id }, { visibility: 'public' });
      await addTvSeriesToPlaylist(p.id, user.id, series.id);
      await testDb.db
        .delete(playlistItem)
        .where(and(eq(playlistItem.playlistId, p.id), eq(playlistItem.tvSeriesId, series.id)));

      const result = await service().listPaginated({
        tvSeriesId: series.id,
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: null,
      });

      expect(result.data).toEqual([]);
    });

    it('paginates results and reports accurate meta', async () => {
      const { user } = await createTestUser(testDb.db);
      const series = await createTestTvSeries(testDb.db);
      for (let i = 0; i < 3; i++) {
        const p = await createTestPlaylist(
          testDb.db,
          { userId: user.id },
          { visibility: 'public' },
        );
        await addTvSeriesToPlaylist(p.id, user.id, series.id);
      }

      const page1 = await service().listPaginated({
        tvSeriesId: series.id,
        query: { ...baseQuery, page: 1, per_page: 2 },
        currentUser: null,
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
      const series = await createTestTvSeries(testDb.db);
      for (let i = 0; i < 3; i++) {
        const p = await createTestPlaylist(
          testDb.db,
          { userId: user.id },
          { visibility: 'public' },
        );
        await addTvSeriesToPlaylist(p.id, user.id, series.id);
      }

      const firstPage = await service().listInfinite({
        tvSeriesId: series.id,
        query: { ...baseQuery, per_page: 2 },
        currentUser: null,
      });
      expect(firstPage.data).toHaveLength(2);
      expect(firstPage.meta.next_cursor).not.toBeNull();

      const secondPage = await service().listInfinite({
        tvSeriesId: series.id,
        query: { ...baseQuery, per_page: 2, cursor: firstPage.meta.next_cursor ?? undefined },
        currentUser: null,
      });
      expect(secondPage.data).toHaveLength(1);
      expect(secondPage.meta.next_cursor).toBeNull();
    });
  });
});
