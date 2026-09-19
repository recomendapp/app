import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { follow, logMovie } from '@libs/db/schemas';
import { createTestMovie, createTestUser, TestDatabase } from '@libs/testing';
import { defaultSupportedLocale } from '@libs/i18n';
import { User } from '../../auth/auth.service';
import { LogMovieSortBy } from '../../movies/logs/log-movie.dto';
import { SortOrder } from '../../../common/dto/sort.dto';
import { UserMoviesService } from './user-movies.service';

describe('UserMoviesService', () => {
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
  const service = () => new UserMoviesService(testDb.db);
  const baseQuery = { sort_by: LogMovieSortBy.UPDATED_AT, sort_order: SortOrder.DESC };

  describe('get', () => {
    it('throws when the target user does not exist', async () => {
      const movie = await createTestMovie(testDb.db);

      await expect(
        service().get({
          userId: '00000000-0000-0000-0000-000000000000',
          movieId: movie.id,
          currentUser: null,
          locale: defaultSupportedLocale,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('blocks an anonymous viewer from a private account log', async () => {
      const { user } = await createTestUser(testDb.db, { profile: { isPrivate: true } });
      const movie = await createTestMovie(testDb.db);
      await testDb.db.insert(logMovie).values({ userId: user.id, movieId: movie.id });

      await expect(
        service().get({
          userId: user.id,
          movieId: movie.id,
          currentUser: null,
          locale: defaultSupportedLocale,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows an accepted follower to see a private account log', async () => {
      const { user } = await createTestUser(testDb.db, { profile: { isPrivate: true } });
      const { user: follower } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      await testDb.db.insert(logMovie).values({ userId: user.id, movieId: movie.id });
      await testDb.db
        .insert(follow)
        .values({ followerId: follower.id, followingId: user.id, status: 'accepted' });

      const result = await service().get({
        userId: user.id,
        movieId: movie.id,
        currentUser: asUser(follower),
        locale: defaultSupportedLocale,
      });

      expect(result?.movie.id).toBe(movie.id);
    });

    it('returns null when there is no log (but the profile is visible)', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);

      const result = await service().get({
        userId: user.id,
        movieId: movie.id,
        currentUser: null,
        locale: defaultSupportedLocale,
      });

      expect(result).toBeNull();
    });

    it('reports a null review when the log has not been reviewed', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      await testDb.db.insert(logMovie).values({ userId: user.id, movieId: movie.id });

      const result = await service().get({
        userId: user.id,
        movieId: movie.id,
        currentUser: null,
        locale: defaultSupportedLocale,
      });

      expect(result?.review).toBeNull();
    });
  });

  describe('listPaginated', () => {
    it('silently omits a private account movie logs from a stranger (empty, not an error)', async () => {
      const { user } = await createTestUser(testDb.db, { profile: { isPrivate: true } });
      const { user: stranger } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      await testDb.db.insert(logMovie).values({ userId: user.id, movieId: movie.id });

      const result = await service().listPaginated({
        userId: user.id,
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: asUser(stranger),
        locale: defaultSupportedLocale,
      });

      expect(result.data).toEqual([]);
    });

    it('includes a private account movie logs for an accepted follower', async () => {
      const { user } = await createTestUser(testDb.db, { profile: { isPrivate: true } });
      const { user: follower } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      await testDb.db.insert(logMovie).values({ userId: user.id, movieId: movie.id });
      await testDb.db
        .insert(follow)
        .values({ followerId: follower.id, followingId: user.id, status: 'accepted' });

      const result = await service().listPaginated({
        userId: user.id,
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: asUser(follower),
        locale: defaultSupportedLocale,
      });

      expect(result.data.map((r) => r.movie.id)).toEqual([movie.id]);
    });

    it('lists the user own movie logs, most recently updated first', async () => {
      const { user } = await createTestUser(testDb.db);
      const older = await createTestMovie(testDb.db);
      const newer = await createTestMovie(testDb.db);
      await testDb.db.insert(logMovie).values({ userId: user.id, movieId: older.id });
      await testDb.db.insert(logMovie).values({ userId: user.id, movieId: newer.id });

      const result = await service().listPaginated({
        userId: user.id,
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: null,
        locale: defaultSupportedLocale,
      });

      expect(result.data.map((r) => r.movie.id)).toEqual([newer.id, older.id]);
    });

    it('does not leak logs from another user', async () => {
      const { user: a } = await createTestUser(testDb.db);
      const { user: b } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      await testDb.db.insert(logMovie).values({ userId: b.id, movieId: movie.id });

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
        const movie = await createTestMovie(testDb.db);
        await testDb.db.insert(logMovie).values({ userId: user.id, movieId: movie.id });
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
      const movies = [];
      for (let i = 0; i < 3; i++) {
        const movie = await createTestMovie(testDb.db);
        await testDb.db.insert(logMovie).values({ userId: user.id, movieId: movie.id });
        movies.push(movie);
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
