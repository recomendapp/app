import { eq } from 'drizzle-orm';
import { playlistItem, playlistMember, playlistSaved, profile } from '@libs/db/schemas';
import {
  createTestMovie,
  createTestPlaylist,
  createTestTvSeries,
  createTestUser,
  TestDatabase,
} from '@libs/testing';
import { SortOrder } from '../../../../common/dto/sort.dto';
import { PlaylistSortBy } from '../../dto/playlists.dto';
import { User } from '../../../auth/auth.service';
import { PlaylistTargetFilter } from './playlists-add-targets.dto';
import { PlaylistsAddTargetsService } from './playlists-add-targets.service';

describe('PlaylistsAddTargetsService', () => {
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
  const service = () => new PlaylistsAddTargetsService(testDb.db);
  const baseQuery = { sort_by: PlaylistSortBy.CREATED_AT, sort_order: SortOrder.ASC };

  async function listAllIds(
    currentUser: User,
    mediaId: number,
    filter?: PlaylistTargetFilter,
    search?: string,
  ) {
    const result = await service().listAll({
      currentUser,
      type: 'movie',
      mediaId,
      query: { ...baseQuery, filter: filter ?? PlaylistTargetFilter.ALL, search },
    });
    return result;
  }

  describe('visibility of candidate playlists', () => {
    it('always includes the current user own playlists', async () => {
      const { user } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: user.id });
      const movie = await createTestMovie(testDb.db);

      const result = await listAllIds(asUser(user), movie.id);

      expect(result.map((r) => r.id)).toEqual([p.id]);
      expect(result[0].role).toBe('owner');
    });

    it('excludes playlists the user neither owns, has saved, nor is a member of', async () => {
      const { user } = await createTestUser(testDb.db);
      const { user: other } = await createTestUser(testDb.db);
      await createTestPlaylist(testDb.db, { userId: other.id });
      const movie = await createTestMovie(testDb.db);

      const result = await listAllIds(asUser(user), movie.id);

      expect(result).toEqual([]);
    });

    it('excludes a saved playlist the user cannot edit', async () => {
      const { user } = await createTestUser(testDb.db);
      const { user: owner } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id }, { visibility: 'public' });
      await testDb.db.insert(playlistSaved).values({ playlistId: p.id, userId: user.id });
      const movie = await createTestMovie(testDb.db);

      const result = await listAllIds(asUser(user), movie.id);

      expect(result).toEqual([]);
    });

    it('includes a saved playlist when the user is an editor and the owner is premium', async () => {
      const { user } = await createTestUser(testDb.db);
      const { user: owner } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id }, { visibility: 'public' });
      await testDb.db.update(profile).set({ isPremium: true }).where(eq(profile.id, owner.id));
      await testDb.db
        .insert(playlistMember)
        .values({ playlistId: p.id, userId: user.id, role: 'editor' });
      await testDb.db.insert(playlistSaved).values({ playlistId: p.id, userId: user.id });
      const movie = await createTestMovie(testDb.db);

      const result = await listAllIds(asUser(user), movie.id);

      expect(result.map((r) => r.id)).toEqual([p.id]);
      expect(result[0].role).toBe('editor');
    });

    it('excludes a saved playlist where the user is only a viewer, even if the owner is premium', async () => {
      const { user } = await createTestUser(testDb.db);
      const { user: owner } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id }, { visibility: 'public' });
      await testDb.db.update(profile).set({ isPremium: true }).where(eq(profile.id, owner.id));
      await testDb.db
        .insert(playlistMember)
        .values({ playlistId: p.id, userId: user.id, role: 'viewer' });
      await testDb.db.insert(playlistSaved).values({ playlistId: p.id, userId: user.id });
      const movie = await createTestMovie(testDb.db);

      const result = await listAllIds(asUser(user), movie.id);

      expect(result).toEqual([]);
    });
  });

  describe('filter parameter', () => {
    it('MINE returns only own playlists, even if a saved+editable playlist would otherwise qualify', async () => {
      const { user } = await createTestUser(testDb.db);
      const { user: owner } = await createTestUser(testDb.db);
      const mine = await createTestPlaylist(testDb.db, { userId: user.id });
      const savedEditable = await createTestPlaylist(
        testDb.db,
        { userId: owner.id },
        { visibility: 'public' },
      );
      await testDb.db.update(profile).set({ isPremium: true }).where(eq(profile.id, owner.id));
      await testDb.db
        .insert(playlistMember)
        .values({ playlistId: savedEditable.id, userId: user.id, role: 'editor' });
      await testDb.db
        .insert(playlistSaved)
        .values({ playlistId: savedEditable.id, userId: user.id });
      const movie = await createTestMovie(testDb.db);

      const result = await listAllIds(asUser(user), movie.id, PlaylistTargetFilter.MINE);

      expect(result.map((r) => r.id)).toEqual([mine.id]);
    });

    it('SAVED excludes the user own playlists, even if not saved', async () => {
      const { user } = await createTestUser(testDb.db);
      await createTestPlaylist(testDb.db, { userId: user.id });
      const movie = await createTestMovie(testDb.db);

      const result = await listAllIds(asUser(user), movie.id, PlaylistTargetFilter.SAVED);

      expect(result).toEqual([]);
    });

    it('SAVED returns an editable saved playlist not owned by the user', async () => {
      const { user } = await createTestUser(testDb.db);
      const { user: owner } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id }, { visibility: 'public' });
      await testDb.db.update(profile).set({ isPremium: true }).where(eq(profile.id, owner.id));
      await testDb.db
        .insert(playlistMember)
        .values({ playlistId: p.id, userId: user.id, role: 'admin' });
      await testDb.db.insert(playlistSaved).values({ playlistId: p.id, userId: user.id });
      const movie = await createTestMovie(testDb.db);

      const result = await listAllIds(asUser(user), movie.id, PlaylistTargetFilter.SAVED);

      expect(result.map((r) => r.id)).toEqual([p.id]);
    });
  });

  describe('alreadyAdded flag', () => {
    it('is false when the media is not yet in the playlist', async () => {
      const { user } = await createTestUser(testDb.db);
      await createTestPlaylist(testDb.db, { userId: user.id });
      const movie = await createTestMovie(testDb.db);

      const result = await listAllIds(asUser(user), movie.id);

      expect(result[0].alreadyAdded).toBe(false);
    });

    it('is true when the media is already in the playlist', async () => {
      const { user } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: user.id });
      const movie = await createTestMovie(testDb.db);
      await testDb.db
        .insert(playlistItem)
        .values({
          playlistId: p.id,
          userId: user.id,
          type: 'movie',
          movieId: movie.id,
          rank: '0|i0000r:',
        });

      const result = await listAllIds(asUser(user), movie.id);

      expect(result[0].alreadyAdded).toBe(true);
    });

    it('does not flag a playlist as alreadyAdded because of a different movie', async () => {
      const { user } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: user.id });
      const inPlaylist = await createTestMovie(testDb.db);
      const other = await createTestMovie(testDb.db);
      await testDb.db
        .insert(playlistItem)
        .values({
          playlistId: p.id,
          userId: user.id,
          type: 'movie',
          movieId: inPlaylist.id,
          rank: '0|i0000r:',
        });

      const result = await listAllIds(asUser(user), other.id);

      expect(result[0].alreadyAdded).toBe(false);
    });

    it('does not flag it added when the same media exists in the playlist as a tv_series item', async () => {
      const { user } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: user.id });
      const tvSeries = await createTestTvSeries(testDb.db);
      await testDb.db
        .insert(playlistItem)
        .values({
          playlistId: p.id,
          userId: user.id,
          type: 'tv_series',
          tvSeriesId: tvSeries.id,
          rank: '0|i0000r:',
        });

      // Same numeric id coincidentally used as a movie id.
      const result = await service().listAll({
        currentUser: asUser(user),
        type: 'movie',
        mediaId: tvSeries.id,
        query: { ...baseQuery, filter: PlaylistTargetFilter.ALL },
      });

      expect(result[0].alreadyAdded).toBe(false);
    });
  });

  describe('search', () => {
    it('filters playlists by title', async () => {
      const { user } = await createTestUser(testDb.db);
      const match = await createTestPlaylist(
        testDb.db,
        { userId: user.id },
        { title: 'Horror Nights' },
      );
      await createTestPlaylist(testDb.db, { userId: user.id }, { title: 'Comedy Gold' });
      const movie = await createTestMovie(testDb.db);

      const result = await listAllIds(asUser(user), movie.id, PlaylistTargetFilter.ALL, 'horror');

      expect(result.map((r) => r.id)).toEqual([match.id]);
    });
  });

  describe('listPaginated', () => {
    it('reports accurate meta', async () => {
      const { user } = await createTestUser(testDb.db);
      for (let i = 0; i < 3; i++) await createTestPlaylist(testDb.db, { userId: user.id });
      const movie = await createTestMovie(testDb.db);

      const result = await service().listPaginated({
        currentUser: asUser(user),
        type: 'movie',
        mediaId: movie.id,
        query: { ...baseQuery, page: 1, per_page: 2, filter: PlaylistTargetFilter.ALL },
      });

      expect(result.data).toHaveLength(2);
      expect(result.meta).toMatchObject({
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
      const playlists = [];
      for (let i = 0; i < 3; i++)
        playlists.push(await createTestPlaylist(testDb.db, { userId: user.id }));
      const movie = await createTestMovie(testDb.db);

      const firstPage = await service().listInfinite({
        currentUser: asUser(user),
        type: 'movie',
        mediaId: movie.id,
        query: { ...baseQuery, per_page: 2, filter: PlaylistTargetFilter.ALL },
      });
      expect(firstPage.data).toHaveLength(2);
      expect(firstPage.meta.next_cursor).not.toBeNull();

      const secondPage = await service().listInfinite({
        currentUser: asUser(user),
        type: 'movie',
        mediaId: movie.id,
        query: {
          ...baseQuery,
          per_page: 2,
          filter: PlaylistTargetFilter.ALL,
          cursor: firstPage.meta.next_cursor ?? undefined,
        },
      });
      expect(secondPage.data).toHaveLength(1);
      expect(secondPage.meta.next_cursor).toBeNull();
    });
  });
});
