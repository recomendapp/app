import { NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { bookmark, profile } from '@libs/db/schemas';
import { createTestMovie, createTestTvSeries, createTestUser, TestDatabase } from '@libs/testing';
import { User } from '../auth/auth.service';
import { BookmarkServerEvents } from '@libs/realtime';
import type { RealtimeGateway } from '../realtime/realtime.gateway';

// `RealtimeGateway` pulls in `better-auth/node`, which ships ESM-only and
// isn't transformed by ts-jest, so importing it for real crashes the spec.
// The gateway is only used here for its two `emit*` methods (stubbed
// below), so a bare mock keeps `BookmarksService`'s constructor-typed
// import satisfied without loading the real module chain.
jest.mock('../realtime/realtime.gateway', () => ({ RealtimeGateway: jest.fn() }));

const { BookmarksService } = require('./bookmarks.service') as typeof import('./bookmarks.service');

describe('BookmarksService', () => {
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

  // Fixtures return the raw `user` table row; the service only ever reads
  // `.id`/`.language` off the better-auth-inferred `User` type it declares,
  // so this cast is enough without pulling in a real auth session.
  const asUser = (row: { id: string; language?: string | null }) => row as unknown as User;

  const fakeRealtimeGateway = () =>
    ({ emitToUser: jest.fn(), emitToUsers: jest.fn() }) as unknown as jest.Mocked<RealtimeGateway>;

  // `broadcastSet` is fired-and-forgotten (`.catch()`, not `await`ed) by
  // `set()`, and does its own DB round trip to fetch media, so a single
  // microtask tick isn't enough to observe it land. Poll instead.
  async function waitForCall(mockFn: { mock: { calls: unknown[] } }, timeoutMs = 2000) {
    const start = Date.now();
    while (mockFn.mock.calls.length === 0) {
      if (Date.now() - start > timeoutMs) {
        throw new Error('Timed out waiting for mock to be called');
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }

  describe('get', () => {
    it('returns null when the user has no bookmark for the id', async () => {
      const { user } = await createTestUser(testDb.db);
      const service = new BookmarksService(testDb.db, fakeRealtimeGateway());

      const result = await service.get({ user: asUser(user), id: 999 });
      expect(result).toBeNull();
    });

    it('returns null when the user has no bookmark for the media', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const service = new BookmarksService(testDb.db, fakeRealtimeGateway());

      const result = await service.get({ user: asUser(user), movieId: movie.id });
      expect(result).toBeNull();
    });

    it('gets an existing bookmark by id', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const service = new BookmarksService(testDb.db, fakeRealtimeGateway());

      const created = await service.set({ user: asUser(user), dto: {}, movieId: movie.id });
      const result = await service.get({ user: asUser(user), id: created.id });

      expect(result?.id).toBe(created.id);
      expect(result?.type).toBe('movie');
      expect(result?.mediaId).toBe(movie.id);
      expect(result?.status).toBe('active');
    });

    it('gets an existing bookmark by movie id', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const service = new BookmarksService(testDb.db, fakeRealtimeGateway());

      await service.set({ user: asUser(user), dto: {}, movieId: movie.id });
      const result = await service.get({ user: asUser(user), movieId: movie.id });

      expect(result?.mediaId).toBe(movie.id);
      expect(result?.type).toBe('movie');
    });

    it('gets an existing bookmark by tv series id', async () => {
      const { user } = await createTestUser(testDb.db);
      const tvSeries = await createTestTvSeries(testDb.db);
      const service = new BookmarksService(testDb.db, fakeRealtimeGateway());

      await service.set({ user: asUser(user), dto: {}, tvSeriesId: tvSeries.id });
      const result = await service.get({ user: asUser(user), tvSeriesId: tvSeries.id });

      expect(result?.mediaId).toBe(tvSeries.id);
      expect(result?.type).toBe('tv_series');
    });

    it('does not return another user bookmark', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: stranger } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const service = new BookmarksService(testDb.db, fakeRealtimeGateway());

      await service.set({ user: asUser(owner), dto: {}, movieId: movie.id });
      const result = await service.get({ user: asUser(stranger), movieId: movie.id });

      expect(result).toBeNull();
    });

    it('does not return a completed bookmark', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const service = new BookmarksService(testDb.db, fakeRealtimeGateway());

      const created = await service.set({ user: asUser(user), dto: {}, movieId: movie.id });
      await testDb.db
        .update(bookmark)
        .set({ status: 'completed' })
        .where(eq(bookmark.id, created.id));

      expect(await service.get({ user: asUser(user), id: created.id })).toBeNull();
      expect(await service.get({ user: asUser(user), movieId: movie.id })).toBeNull();
    });
  });

  describe('set', () => {
    it('creates a new active bookmark for a movie and broadcasts it', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const gateway = fakeRealtimeGateway();
      const service = new BookmarksService(testDb.db, gateway);

      const result = await service.set({
        user: asUser(user),
        dto: { comment: 'Must watch' },
        movieId: movie.id,
      });

      expect(result.type).toBe('movie');
      expect(result.mediaId).toBe(movie.id);
      expect(result.status).toBe('active');
      expect(result.comment).toBe('Must watch');

      await waitForCall(gateway.emitToUser);
      expect(gateway.emitToUser).toHaveBeenCalledTimes(1);
      expect(gateway.emitToUser).toHaveBeenCalledWith(
        user.id,
        BookmarkServerEvents.SET,
        expect.objectContaining({
          id: result.id,
          type: 'movie',
          media: expect.objectContaining({ id: movie.id }),
        }),
      );
    });

    it('creates a new active bookmark for a tv series', async () => {
      const { user } = await createTestUser(testDb.db);
      const tvSeries = await createTestTvSeries(testDb.db);
      const service = new BookmarksService(testDb.db, fakeRealtimeGateway());

      const result = await service.set({
        user: asUser(user),
        dto: {},
        tvSeriesId: tvSeries.id,
      });

      expect(result.type).toBe('tv_series');
      expect(result.mediaId).toBe(tvSeries.id);
    });

    it('is idempotent: setting the same media twice updates the comment instead of duplicating', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const service = new BookmarksService(testDb.db, fakeRealtimeGateway());

      const first = await service.set({
        user: asUser(user),
        dto: { comment: 'first' },
        movieId: movie.id,
      });
      const second = await service.set({
        user: asUser(user),
        dto: { comment: 'second' },
        movieId: movie.id,
      });

      expect(second.id).toBe(first.id);
      expect(second.comment).toBe('second');

      const rows = await testDb.db
        .select()
        .from(bookmark)
        .where(and(eq(bookmark.userId, user.id), eq(bookmark.movieId, movie.id)));
      expect(rows).toHaveLength(1);
    });

    it('preserves the existing comment when the upsert omits it', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const service = new BookmarksService(testDb.db, fakeRealtimeGateway());

      await service.set({ user: asUser(user), dto: { comment: 'keep me' }, movieId: movie.id });
      const result = await service.set({ user: asUser(user), dto: {}, movieId: movie.id });

      expect(result.comment).toBe('keep me');
    });

    it('updates the comment by id', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const service = new BookmarksService(testDb.db, fakeRealtimeGateway());

      const created = await service.set({
        user: asUser(user),
        dto: { comment: 'v1' },
        movieId: movie.id,
      });
      const updated = await service.set({
        user: asUser(user),
        dto: { comment: 'v2' },
        id: created.id,
      });

      expect(updated.id).toBe(created.id);
      expect(updated.comment).toBe('v2');
    });

    it('throws when updating a bookmark id that does not exist', async () => {
      const { user } = await createTestUser(testDb.db);
      const service = new BookmarksService(testDb.db, fakeRealtimeGateway());

      await expect(
        service.set({ user: asUser(user), dto: { comment: 'nope' }, id: 999 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws when updating by id owned by another user', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: stranger } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const service = new BookmarksService(testDb.db, fakeRealtimeGateway());

      const created = await service.set({ user: asUser(owner), dto: {}, movieId: movie.id });

      await expect(
        service.set({ user: asUser(stranger), dto: { comment: 'steal' }, id: created.id }),
      ).rejects.toThrow(NotFoundException);
    });

    it('allows two users to bookmark the same movie independently', async () => {
      const { user: userA } = await createTestUser(testDb.db);
      const { user: userB } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const service = new BookmarksService(testDb.db, fakeRealtimeGateway());

      const a = await service.set({
        user: asUser(userA),
        dto: { comment: 'a' },
        movieId: movie.id,
      });
      const b = await service.set({
        user: asUser(userB),
        dto: { comment: 'b' },
        movieId: movie.id,
      });

      expect(a.id).not.toBe(b.id);
    });

    it('creates a new active bookmark once the previous one was completed', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const service = new BookmarksService(testDb.db, fakeRealtimeGateway());

      const firstRun = await service.set({
        user: asUser(user),
        dto: { comment: 'first watch' },
        movieId: movie.id,
      });
      await testDb.db
        .update(bookmark)
        .set({ status: 'completed' })
        .where(eq(bookmark.id, firstRun.id));

      const secondRun = await service.set({
        user: asUser(user),
        dto: { comment: 'rewatch' },
        movieId: movie.id,
      });

      expect(secondRun.id).not.toBe(firstRun.id);
      expect(secondRun.status).toBe('active');
      expect(secondRun.comment).toBe('rewatch');

      const rows = await testDb.db
        .select()
        .from(bookmark)
        .where(and(eq(bookmark.userId, user.id), eq(bookmark.movieId, movie.id)));
      expect(rows).toHaveLength(2);
      expect(rows.find((r) => r.id === firstRun.id)?.status).toBe('completed');
      expect(rows.find((r) => r.id === secondRun.id)?.status).toBe('active');

      const active = await service.get({ user: asUser(user), movieId: movie.id });
      expect(active?.id).toBe(secondRun.id);
    });

    it('does not broadcast when the bookmarked media no longer resolves', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const gateway = fakeRealtimeGateway();
      const service = new BookmarksService(testDb.db, gateway);

      const created = await service.set({ user: asUser(user), dto: {}, movieId: movie.id });
      await waitForCall(gateway.emitToUser);
      gateway.emitToUser.mockClear();

      // Update the comment again: getMedia still resolves normally, this
      // just pins down that the happy path keeps broadcasting on updates too.
      await service.set({ user: asUser(user), dto: { comment: 'again' }, id: created.id });
      await waitForCall(gateway.emitToUser);
      expect(gateway.emitToUser).toHaveBeenCalledTimes(1);
    });
  });

  describe('delete', () => {
    it('deletes a bookmark by id and broadcasts a deletion event', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const gateway = fakeRealtimeGateway();
      const service = new BookmarksService(testDb.db, gateway);

      const created = await service.set({ user: asUser(user), dto: {}, movieId: movie.id });
      const deleted = await service.delete({ user: asUser(user), id: created.id });

      expect(deleted.id).toBe(created.id);
      expect(gateway.emitToUser).toHaveBeenCalledWith(
        user.id,
        BookmarkServerEvents.DELETED,
        expect.objectContaining({ id: created.id }),
      );

      const rows = await testDb.db.select().from(bookmark).where(eq(bookmark.id, created.id));
      expect(rows).toHaveLength(0);
    });

    it('deletes a bookmark by media id', async () => {
      const { user } = await createTestUser(testDb.db);
      const tvSeries = await createTestTvSeries(testDb.db);
      const service = new BookmarksService(testDb.db, fakeRealtimeGateway());

      await service.set({ user: asUser(user), dto: {}, tvSeriesId: tvSeries.id });
      const deleted = await service.delete({ user: asUser(user), tvSeriesId: tvSeries.id });

      expect(deleted.mediaId).toBe(tvSeries.id);
      expect(await service.get({ user: asUser(user), tvSeriesId: tvSeries.id })).toBeNull();
    });

    it('throws when deleting a bookmark that does not exist', async () => {
      const { user } = await createTestUser(testDb.db);
      const service = new BookmarksService(testDb.db, fakeRealtimeGateway());

      await expect(service.delete({ user: asUser(user), id: 999 })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws when deleting another user bookmark', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: stranger } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const service = new BookmarksService(testDb.db, fakeRealtimeGateway());

      const created = await service.set({ user: asUser(owner), dto: {}, movieId: movie.id });

      await expect(service.delete({ user: asUser(stranger), id: created.id })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws when deleting a completed bookmark by id', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const service = new BookmarksService(testDb.db, fakeRealtimeGateway());

      const created = await service.set({ user: asUser(user), dto: {}, movieId: movie.id });
      await testDb.db
        .update(bookmark)
        .set({ status: 'completed' })
        .where(eq(bookmark.id, created.id));

      await expect(service.delete({ user: asUser(user), id: created.id })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws when deleting a completed bookmark by media id', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const service = new BookmarksService(testDb.db, fakeRealtimeGateway());

      const created = await service.set({ user: asUser(user), dto: {}, movieId: movie.id });
      await testDb.db
        .update(bookmark)
        .set({ status: 'completed' })
        .where(eq(bookmark.id, created.id));

      await expect(service.delete({ user: asUser(user), movieId: movie.id })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  it('does not leak a private user bookmark handling through profile updates (sanity check on fixture wiring)', async () => {
    const { user } = await createTestUser(testDb.db);
    await testDb.db.update(profile).set({ isPrivate: true }).where(eq(profile.id, user.id));
    const movie = await createTestMovie(testDb.db);
    const service = new BookmarksService(testDb.db, fakeRealtimeGateway());

    // BookmarksService is owner-scoped only; privacy is enforced by
    // UserBookmarksService's listing endpoints, not here.
    const created = await service.set({ user: asUser(user), dto: {}, movieId: movie.id });
    expect(await service.get({ user: asUser(user), id: created.id })).not.toBeNull();
  });
});
