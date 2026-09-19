import { and, eq } from 'drizzle-orm';
import { playlistItem, playlistMember } from '@libs/db/schemas';
import { createTestMovie, createTestPlaylist, createTestUser, TestDatabase } from '@libs/testing';
import { User } from '../../auth/auth.service';
import { PlaylistSortBy } from '../../playlists/dto/playlists.dto';
import { SortOrder } from '../../../common/dto/sort.dto';
import { MoviePlaylistsService } from './movie-playlists.service';

describe('MoviePlaylistsService', () => {
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
  const service = () => new MoviePlaylistsService(testDb.db);
  const baseQuery = { sort_by: PlaylistSortBy.CREATED_AT, sort_order: SortOrder.ASC };

  async function addMovieToPlaylist(
    playlistId: number,
    userId: string,
    movieId: number,
    rank = 'a0',
  ) {
    await testDb.db
      .insert(playlistItem)
      .values({ playlistId, userId, movieId, type: 'movie', rank });
  }

  describe('listPaginated', () => {
    it('only lists playlists that actually contain the movie', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const otherMovie = await createTestMovie(testDb.db);
      const withMovie = await createTestPlaylist(
        testDb.db,
        { userId: user.id },
        { visibility: 'public' },
      );
      const withoutMovie = await createTestPlaylist(
        testDb.db,
        { userId: user.id },
        { visibility: 'public' },
      );
      await addMovieToPlaylist(withMovie.id, user.id, movie.id);
      await addMovieToPlaylist(withoutMovie.id, user.id, otherMovie.id);

      const result = await service().listPaginated({
        movieId: movie.id,
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: null,
      });

      expect(result.data.map((p) => p.id)).toEqual([withMovie.id]);
    });

    it('hides a private playlist containing the movie from a non-member', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: viewer } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const p = await createTestPlaylist(
        testDb.db,
        { userId: owner.id },
        { visibility: 'private' },
      );
      await addMovieToPlaylist(p.id, owner.id, movie.id);

      const result = await service().listPaginated({
        movieId: movie.id,
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: asUser(viewer),
      });

      expect(result.data).toEqual([]);
    });

    it('shows a private playlist containing the movie to a member', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: member } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const p = await createTestPlaylist(
        testDb.db,
        { userId: owner.id },
        { visibility: 'private' },
      );
      await addMovieToPlaylist(p.id, owner.id, movie.id);
      await testDb.db
        .insert(playlistMember)
        .values({ playlistId: p.id, userId: member.id, role: 'viewer' });

      const result = await service().listPaginated({
        movieId: movie.id,
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: asUser(member),
      });

      expect(result.data.map((p) => p.id)).toEqual([p.id]);
    });

    it('stops listing a playlist once the movie is removed from it', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: user.id }, { visibility: 'public' });
      await addMovieToPlaylist(p.id, user.id, movie.id);
      await testDb.db
        .delete(playlistItem)
        .where(and(eq(playlistItem.playlistId, p.id), eq(playlistItem.movieId, movie.id)));

      const result = await service().listPaginated({
        movieId: movie.id,
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: null,
      });

      expect(result.data).toEqual([]);
    });

    it('paginates results and reports accurate meta', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const playlists = [];
      for (let i = 0; i < 3; i++) {
        const p = await createTestPlaylist(
          testDb.db,
          { userId: user.id },
          { visibility: 'public' },
        );
        await addMovieToPlaylist(p.id, user.id, movie.id);
        playlists.push(p);
      }

      const page1 = await service().listPaginated({
        movieId: movie.id,
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
      const movie = await createTestMovie(testDb.db);
      const playlists = [];
      for (let i = 0; i < 3; i++) {
        const p = await createTestPlaylist(
          testDb.db,
          { userId: user.id },
          { visibility: 'public' },
        );
        await addMovieToPlaylist(p.id, user.id, movie.id);
        playlists.push(p);
      }

      const firstPage = await service().listInfinite({
        movieId: movie.id,
        query: { ...baseQuery, per_page: 2 },
        currentUser: null,
      });
      expect(firstPage.data).toHaveLength(2);
      expect(firstPage.meta.next_cursor).not.toBeNull();

      const secondPage = await service().listInfinite({
        movieId: movie.id,
        query: { ...baseQuery, per_page: 2, cursor: firstPage.meta.next_cursor ?? undefined },
        currentUser: null,
      });
      expect(secondPage.data).toHaveLength(1);
      expect(secondPage.meta.next_cursor).toBeNull();
    });
  });
});
