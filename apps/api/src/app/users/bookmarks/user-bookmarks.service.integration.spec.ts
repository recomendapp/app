import { BadRequestException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { bookmark, follow, profile } from '@libs/db/schemas';
import { createTestMovie, createTestTvSeries, createTestUser, TestDatabase } from '@libs/testing';
import { defaultSupportedLocale } from '@libs/i18n';
import { User } from '../../auth/auth.service';
import { UserBookmarksService } from './user-bookmarks.service';
import { BookmarkSortBy } from '../../bookmarks/dto/bookmarks.dto';
import { SortOrder } from '../../../common/dto/sort.dto';

describe('UserBookmarksService', () => {
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

  const baseQuery = {
    status: 'active' as const,
    sort_by: BookmarkSortBy.CREATED_AT,
    sort_order: SortOrder.ASC,
  };

  async function bookmarkMovie(userId: string, comment?: string) {
    const movie = await createTestMovie(testDb.db);
    const [row] = await testDb.db
      .insert(bookmark)
      .values({ userId, movieId: movie.id, type: 'movie', comment })
      .returning();
    return { movie, row };
  }

  async function bookmarkTvSeries(userId: string) {
    const tvSeries = await createTestTvSeries(testDb.db);
    const [row] = await testDb.db
      .insert(bookmark)
      .values({ userId, tvSeriesId: tvSeries.id, type: 'tv_series' })
      .returning();
    return { tvSeries, row };
  }

  describe('listAll', () => {
    it('returns an empty array for a user with no bookmarks', async () => {
      const { user } = await createTestUser(testDb.db);
      const service = new UserBookmarksService(testDb.db);

      const result = await service.listAll({
        targetUserId: user.id,
        query: baseQuery,
        currentUser: asUser(user),
        locale: defaultSupportedLocale,
      });

      expect(result).toEqual([]);
    });

    it('returns bookmarks with their attached media', async () => {
      const { user } = await createTestUser(testDb.db);
      const { movie } = await bookmarkMovie(user.id);
      const { tvSeries } = await bookmarkTvSeries(user.id);
      const service = new UserBookmarksService(testDb.db);

      const result = await service.listAll({
        targetUserId: user.id,
        query: baseQuery,
        currentUser: asUser(user),
        locale: defaultSupportedLocale,
      });

      expect(result).toHaveLength(2);
      const movieEntry = result.find((b) => b.type === 'movie');
      const tvEntry = result.find((b) => b.type === 'tv_series');
      expect(movieEntry?.mediaId).toBe(movie.id);
      expect(movieEntry?.media.id).toBe(movie.id);
      expect(tvEntry?.mediaId).toBe(tvSeries.id);
      expect(tvEntry?.media.id).toBe(tvSeries.id);
    });

    it('filters by status', async () => {
      const { user } = await createTestUser(testDb.db);
      const { row: activeRow } = await bookmarkMovie(user.id);
      const { row: completedRow } = await bookmarkMovie(user.id);
      await testDb.db
        .update(bookmark)
        .set({ status: 'completed' })
        .where(eq(bookmark.id, completedRow.id));
      const service = new UserBookmarksService(testDb.db);

      const activeOnly = await service.listAll({
        targetUserId: user.id,
        query: { ...baseQuery, status: 'active' },
        currentUser: asUser(user),
        locale: defaultSupportedLocale,
      });
      expect(activeOnly.map((b) => b.id)).toEqual([activeRow.id]);

      const completedOnly = await service.listAll({
        targetUserId: user.id,
        query: { ...baseQuery, status: 'completed' },
        currentUser: asUser(user),
        locale: defaultSupportedLocale,
      });
      expect(completedOnly.map((b) => b.id)).toEqual([completedRow.id]);
    });

    it('filters by type', async () => {
      const { user } = await createTestUser(testDb.db);
      const { row: movieRow } = await bookmarkMovie(user.id);
      await bookmarkTvSeries(user.id);
      const service = new UserBookmarksService(testDb.db);

      const result = await service.listAll({
        targetUserId: user.id,
        query: { ...baseQuery, type: 'movie' },
        currentUser: asUser(user),
        locale: defaultSupportedLocale,
      });

      expect(result.map((b) => b.id)).toEqual([movieRow.id]);
    });

    it('sorts by created_at ascending and descending', async () => {
      const { user } = await createTestUser(testDb.db);
      const { row: first } = await bookmarkMovie(user.id);
      const { row: second } = await bookmarkMovie(user.id);
      const service = new UserBookmarksService(testDb.db);

      const asc = await service.listAll({
        targetUserId: user.id,
        query: { ...baseQuery, sort_order: SortOrder.ASC },
        currentUser: asUser(user),
        locale: defaultSupportedLocale,
      });
      expect(asc.map((b) => b.id)).toEqual([first.id, second.id]);

      const desc = await service.listAll({
        targetUserId: user.id,
        query: { ...baseQuery, sort_order: SortOrder.DESC },
        currentUser: asUser(user),
        locale: defaultSupportedLocale,
      });
      expect(desc.map((b) => b.id)).toEqual([second.id, first.id]);
    });

    it('does not throw when sorting randomly and still returns every bookmark', async () => {
      const { user } = await createTestUser(testDb.db);
      await bookmarkMovie(user.id);
      await bookmarkMovie(user.id);
      const service = new UserBookmarksService(testDb.db);

      const result = await service.listAll({
        targetUserId: user.id,
        query: { ...baseQuery, sort_by: BookmarkSortBy.RANDOM },
        currentUser: asUser(user),
        locale: defaultSupportedLocale,
      });

      expect(result).toHaveLength(2);
    });

    it('lets the owner see their own bookmarks even when the profile is private', async () => {
      const { user } = await createTestUser(testDb.db);
      await testDb.db.update(profile).set({ isPrivate: true }).where(eq(profile.id, user.id));
      await bookmarkMovie(user.id);
      const service = new UserBookmarksService(testDb.db);

      const result = await service.listAll({
        targetUserId: user.id,
        query: baseQuery,
        currentUser: asUser(user),
        locale: defaultSupportedLocale,
      });

      expect(result).toHaveLength(1);
    });

    it('lets an anonymous viewer see bookmarks of a public profile', async () => {
      const { user } = await createTestUser(testDb.db);
      await bookmarkMovie(user.id);
      const service = new UserBookmarksService(testDb.db);

      const result = await service.listAll({
        targetUserId: user.id,
        query: baseQuery,
        currentUser: null,
        locale: defaultSupportedLocale,
      });

      expect(result).toHaveLength(1);
    });

    it('hides bookmarks of a private profile from an anonymous viewer', async () => {
      const { user } = await createTestUser(testDb.db);
      await testDb.db.update(profile).set({ isPrivate: true }).where(eq(profile.id, user.id));
      await bookmarkMovie(user.id);
      const service = new UserBookmarksService(testDb.db);

      const result = await service.listAll({
        targetUserId: user.id,
        query: baseQuery,
        currentUser: null,
        locale: defaultSupportedLocale,
      });

      expect(result).toEqual([]);
    });

    it('hides bookmarks of a private profile from a non-follower', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      await testDb.db.update(profile).set({ isPrivate: true }).where(eq(profile.id, owner.id));
      await bookmarkMovie(owner.id);
      const { user: stranger } = await createTestUser(testDb.db);
      const service = new UserBookmarksService(testDb.db);

      const result = await service.listAll({
        targetUserId: owner.id,
        query: baseQuery,
        currentUser: asUser(stranger),
        locale: defaultSupportedLocale,
      });

      expect(result).toEqual([]);
    });

    it('hides bookmarks of a private profile from a follower whose request is still pending', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      await testDb.db.update(profile).set({ isPrivate: true }).where(eq(profile.id, owner.id));
      await bookmarkMovie(owner.id);
      const { user: follower } = await createTestUser(testDb.db);
      await testDb.db
        .insert(follow)
        .values({ followerId: follower.id, followingId: owner.id, status: 'pending' });
      const service = new UserBookmarksService(testDb.db);

      const result = await service.listAll({
        targetUserId: owner.id,
        query: baseQuery,
        currentUser: asUser(follower),
        locale: defaultSupportedLocale,
      });

      expect(result).toEqual([]);
    });

    it('shows bookmarks of a private profile to an accepted follower', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      await testDb.db.update(profile).set({ isPrivate: true }).where(eq(profile.id, owner.id));
      await bookmarkMovie(owner.id);
      const { user: follower } = await createTestUser(testDb.db);
      await testDb.db
        .insert(follow)
        .values({ followerId: follower.id, followingId: owner.id, status: 'accepted' });
      const service = new UserBookmarksService(testDb.db);

      const result = await service.listAll({
        targetUserId: owner.id,
        query: baseQuery,
        currentUser: asUser(follower),
        locale: defaultSupportedLocale,
      });

      expect(result).toHaveLength(1);
    });
  });

  describe('listPaginated', () => {
    it('paginates results and reports accurate meta', async () => {
      const { user } = await createTestUser(testDb.db);
      const rows = [];
      for (let i = 0; i < 3; i++) {
        rows.push((await bookmarkMovie(user.id)).row);
      }
      const service = new UserBookmarksService(testDb.db);

      const page1 = await service.listPaginated({
        targetUserId: user.id,
        query: { ...baseQuery, page: 1, per_page: 2 },
        currentUser: asUser(user),
        locale: defaultSupportedLocale,
      });
      expect(page1.data.map((b) => b.id)).toEqual([rows[0].id, rows[1].id]);
      expect(page1.meta).toEqual({
        total_results: 3,
        total_pages: 2,
        current_page: 1,
        per_page: 2,
      });

      const page2 = await service.listPaginated({
        targetUserId: user.id,
        query: { ...baseQuery, page: 2, per_page: 2 },
        currentUser: asUser(user),
        locale: defaultSupportedLocale,
      });
      expect(page2.data.map((b) => b.id)).toEqual([rows[2].id]);
      expect(page2.meta.current_page).toBe(2);
    });

    it('respects privacy the same way listAll does', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      await testDb.db.update(profile).set({ isPrivate: true }).where(eq(profile.id, owner.id));
      await bookmarkMovie(owner.id);
      const { user: stranger } = await createTestUser(testDb.db);
      const service = new UserBookmarksService(testDb.db);

      const result = await service.listPaginated({
        targetUserId: owner.id,
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: asUser(stranger),
        locale: defaultSupportedLocale,
      });

      expect(result.data).toEqual([]);
      expect(result.meta.total_results).toBe(0);
    });
  });

  describe('listInfinite', () => {
    it('paginates with a cursor until there is no next page', async () => {
      const { user } = await createTestUser(testDb.db);
      const rows = [];
      for (let i = 0; i < 3; i++) {
        rows.push((await bookmarkMovie(user.id)).row);
      }
      const service = new UserBookmarksService(testDb.db);

      const firstPage = await service.listInfinite({
        targetUserId: user.id,
        query: { ...baseQuery, per_page: 2 },
        currentUser: asUser(user),
        locale: defaultSupportedLocale,
      });
      expect(firstPage.data.map((b) => b.id)).toEqual([rows[0].id, rows[1].id]);
      expect(firstPage.meta.next_cursor).not.toBeNull();
      expect(firstPage.meta.total_results).toBe(3);

      const secondPage = await service.listInfinite({
        targetUserId: user.id,
        query: { ...baseQuery, per_page: 2, cursor: firstPage.meta.next_cursor ?? undefined },
        currentUser: asUser(user),
        locale: defaultSupportedLocale,
      });
      expect(secondPage.data.map((b) => b.id)).toEqual([rows[2].id]);
      expect(secondPage.meta.next_cursor).toBeNull();
    });

    it('paginates by updated_at when requested', async () => {
      const { user } = await createTestUser(testDb.db);
      const { row: first } = await bookmarkMovie(user.id);
      const { row: second } = await bookmarkMovie(user.id);
      await testDb.db
        .update(bookmark)
        .set({ updatedAt: new Date(Date.now() + 60_000).toISOString() })
        .where(eq(bookmark.id, first.id));
      const service = new UserBookmarksService(testDb.db);

      const result = await service.listInfinite({
        targetUserId: user.id,
        query: {
          ...baseQuery,
          per_page: 10,
          sort_by: BookmarkSortBy.UPDATED_AT,
          sort_order: SortOrder.DESC,
        },
        currentUser: asUser(user),
        locale: defaultSupportedLocale,
      });

      expect(result.data.map((b) => b.id)).toEqual([first.id, second.id]);
    });

    it('rejects a cursor that is not valid base64-encoded JSON', async () => {
      const { user } = await createTestUser(testDb.db);
      const service = new UserBookmarksService(testDb.db);

      await expect(
        service.listInfinite({
          targetUserId: user.id,
          query: { ...baseQuery, per_page: 10, cursor: 'not-a-valid-cursor' },
          currentUser: asUser(user),
          locale: defaultSupportedLocale,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a cursor that decodes to the wrong shape', async () => {
      const { user } = await createTestUser(testDb.db);
      const wrongShapeCursor = Buffer.from(JSON.stringify({ foo: 'bar' })).toString('base64');
      const service = new UserBookmarksService(testDb.db);

      await expect(
        service.listInfinite({
          targetUserId: user.id,
          query: { ...baseQuery, per_page: 10, cursor: wrongShapeCursor },
          currentUser: asUser(user),
          locale: defaultSupportedLocale,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
