import { BadRequestException, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { logMovieWatchedDate } from '@libs/db/schemas';
import { createTestLogMovie, createTestMovie, createTestUser, TestDatabase } from '@libs/testing';
import { User } from '../../../auth/auth.service';
import { LogServerEvents } from '@libs/realtime';
import type { RealtimeGateway } from '../../../realtime/realtime.gateway';
import { WatchedDateSortBy } from './dto/watched-dates.dto';
import { SortOrder } from '../../../../common/dto/sort.dto';

jest.mock('../../../realtime/realtime.gateway', () => ({ RealtimeGateway: jest.fn() }));

const { MovieWatchedDatesService } =
  require('./movie-watched-dates.service') as typeof import('./movie-watched-dates.service');

describe('MovieWatchedDatesService', () => {
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
  const fakeGateway = () => ({ emitToUser: jest.fn() }) as unknown as jest.Mocked<RealtimeGateway>;

  function buildService(gateway?: jest.Mocked<RealtimeGateway>) {
    return new MovieWatchedDatesService(testDb.db, gateway ?? fakeGateway());
  }

  async function insertWatchedDate(
    logMovieId: number,
    overrides?: Partial<typeof logMovieWatchedDate.$inferInsert>,
  ) {
    const [row] = await testDb.db
      .insert(logMovieWatchedDate)
      .values({ logMovieId, watchedDate: new Date('2024-01-01'), ...overrides })
      .returning();
    return row;
  }

  describe('set', () => {
    it('throws when the movie has not been logged', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const service = buildService();

      await expect(
        service.set({
          user: asUser(user),
          movieId: movie.id,
          dto: { watchedDate: '2024-01-01T00:00:00Z' },
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('adds a watched date and resyncs the log aggregates', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const log = await createTestLogMovie(testDb.db, { userId: user.id, movieId: movie.id });
      await insertWatchedDate(log.id, { watchedDate: new Date('2024-01-01') });
      const service = buildService();

      const result = await service.set({
        user: asUser(user),
        movieId: movie.id,
        dto: { watchedDate: '2024-06-01T00:00:00Z', format: 'streaming', comment: 'Rewatch' },
      });

      expect(result.log.watchCount).toBe(2);
      expect(new Date(result.log.firstWatchedAt).toISOString().slice(0, 10)).toBe('2024-01-01');
      expect(new Date(result.log.lastWatchedAt).toISOString().slice(0, 10)).toBe('2024-06-01');
      expect(result.watchedDate.format).toBe('streaming');
      expect(result.watchedDate.comment).toBe('Rewatch');
    });

    it('emits a MOVIE_WATCHED_DATE_SET realtime event', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const log = await createTestLogMovie(testDb.db, { userId: user.id, movieId: movie.id });
      await insertWatchedDate(log.id);
      const gateway = fakeGateway();
      const service = buildService(gateway);

      const result = await service.set({
        user: asUser(user),
        movieId: movie.id,
        dto: { watchedDate: '2024-02-01T00:00:00Z' },
      });

      expect(gateway.emitToUser).toHaveBeenCalledWith(
        user.id,
        LogServerEvents.MOVIE_WATCHED_DATE_SET,
        result,
      );
    });
  });

  describe('update', () => {
    it('throws when the movie has not been logged', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const service = buildService();

      await expect(service.update(asUser(user), movie.id, 1, {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws when the watched date does not belong to that log', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: stranger } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const log = await createTestLogMovie(testDb.db, { userId: owner.id, movieId: movie.id });
      const date = await insertWatchedDate(log.id);
      await createTestLogMovie(testDb.db, { userId: stranger.id, movieId: movie.id });
      const service = buildService();

      await expect(
        service.update(asUser(stranger), movie.id, date.id, { comment: 'nope' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates the format and comment', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const log = await createTestLogMovie(testDb.db, { userId: user.id, movieId: movie.id });
      const date = await insertWatchedDate(log.id, { format: 'theater', comment: 'Original' });
      const service = buildService();

      const result = await service.update(asUser(user), movie.id, date.id, {
        format: 'digital',
        comment: 'Updated',
      });

      expect(result.watchedDate.format).toBe('digital');
      expect(result.watchedDate.comment).toBe('Updated');
    });

    it('keeps the existing comment when comment is omitted from the update', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const log = await createTestLogMovie(testDb.db, { userId: user.id, movieId: movie.id });
      const date = await insertWatchedDate(log.id, { comment: 'Keep me' });
      const service = buildService();

      const result = await service.update(asUser(user), movie.id, date.id, { format: 'physical' });

      expect(result.watchedDate.comment).toBe('Keep me');
    });

    it('resyncs first/last watched at after moving a date', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const log = await createTestLogMovie(testDb.db, { userId: user.id, movieId: movie.id });
      await insertWatchedDate(log.id, { watchedDate: new Date('2024-01-01') });
      const dateToMove = await insertWatchedDate(log.id, { watchedDate: new Date('2024-02-01') });
      const service = buildService();

      const result = await service.update(asUser(user), movie.id, dateToMove.id, {
        watchedDate: '2024-12-25T00:00:00Z',
      });

      expect(new Date(result.log.lastWatchedAt).toISOString().slice(0, 10)).toBe('2024-12-25');
    });

    it('emits a MOVIE_WATCHED_DATE_UPDATED realtime event', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const log = await createTestLogMovie(testDb.db, { userId: user.id, movieId: movie.id });
      const date = await insertWatchedDate(log.id);
      const gateway = fakeGateway();
      const service = buildService(gateway);

      const result = await service.update(asUser(user), movie.id, date.id, { comment: 'x' });

      expect(gateway.emitToUser).toHaveBeenCalledWith(
        user.id,
        LogServerEvents.MOVIE_WATCHED_DATE_UPDATED,
        result,
      );
    });
  });

  describe('delete', () => {
    it('throws when the movie has not been logged', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const service = buildService();

      await expect(service.delete(asUser(user), movie.id, 1)).rejects.toThrow(NotFoundException);
    });

    it('refuses to delete the last remaining watched date', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const log = await createTestLogMovie(testDb.db, { userId: user.id, movieId: movie.id });
      const date = await insertWatchedDate(log.id);
      const service = buildService();

      await expect(service.delete(asUser(user), movie.id, date.id)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws when the watched date does not exist', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const log = await createTestLogMovie(testDb.db, { userId: user.id, movieId: movie.id });
      await insertWatchedDate(log.id);
      await insertWatchedDate(log.id);
      const service = buildService();

      await expect(service.delete(asUser(user), movie.id, 999999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deletes a watched date and resyncs the log aggregates', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const log = await createTestLogMovie(testDb.db, { userId: user.id, movieId: movie.id });
      await insertWatchedDate(log.id, { watchedDate: new Date('2024-01-01') });
      const toDelete = await insertWatchedDate(log.id, { watchedDate: new Date('2024-06-01') });
      const service = buildService();

      const result = await service.delete(asUser(user), movie.id, toDelete.id);

      expect(result.log.watchCount).toBe(1);
      expect(new Date(result.log.lastWatchedAt).toISOString().slice(0, 10)).toBe('2024-01-01');

      const remaining = await testDb.db
        .select()
        .from(logMovieWatchedDate)
        .where(eq(logMovieWatchedDate.logMovieId, log.id));
      expect(remaining).toHaveLength(1);
    });

    it('emits a MOVIE_WATCHED_DATE_DELETED realtime event', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const log = await createTestLogMovie(testDb.db, { userId: user.id, movieId: movie.id });
      await insertWatchedDate(log.id, { watchedDate: new Date('2024-01-01') });
      const toDelete = await insertWatchedDate(log.id, { watchedDate: new Date('2024-06-01') });
      const gateway = fakeGateway();
      const service = buildService(gateway);

      const result = await service.delete(asUser(user), movie.id, toDelete.id);

      expect(gateway.emitToUser).toHaveBeenCalledWith(
        user.id,
        LogServerEvents.MOVIE_WATCHED_DATE_DELETED,
        result,
      );
    });
  });

  describe('listPaginated / listInfinite', () => {
    const baseQuery = { sort_by: WatchedDateSortBy.WATCHED_DATE, sort_order: SortOrder.ASC };

    it('only lists the current user own watched dates for that movie', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: stranger } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const ownerLog = await createTestLogMovie(testDb.db, { userId: owner.id, movieId: movie.id });
      const strangerLog = await createTestLogMovie(testDb.db, {
        userId: stranger.id,
        movieId: movie.id,
      });
      await insertWatchedDate(ownerLog.id, { watchedDate: new Date('2024-01-01') });
      await insertWatchedDate(strangerLog.id, { watchedDate: new Date('2024-01-01') });
      const service = buildService();

      const result = await service.listPaginated(asUser(owner), movie.id, {
        ...baseQuery,
        page: 1,
        per_page: 10,
      });

      expect(result.data).toHaveLength(1);
    });

    it('paginates results and reports accurate meta', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const log = await createTestLogMovie(testDb.db, { userId: user.id, movieId: movie.id });
      const dates = [];
      for (let i = 1; i <= 3; i++) {
        dates.push(await insertWatchedDate(log.id, { watchedDate: new Date(`2024-0${i}-01`) }));
      }
      const service = buildService();

      const page1 = await service.listPaginated(asUser(user), movie.id, {
        ...baseQuery,
        page: 1,
        per_page: 2,
      });
      expect(page1.data.map((d) => d.id)).toEqual([dates[0].id, dates[1].id]);
      expect(page1.meta).toEqual({
        total_results: 3,
        total_pages: 2,
        current_page: 1,
        per_page: 2,
      });
    });

    it('paginates with a cursor until there is no next page', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const log = await createTestLogMovie(testDb.db, { userId: user.id, movieId: movie.id });
      const dates = [];
      for (let i = 1; i <= 3; i++) {
        dates.push(await insertWatchedDate(log.id, { watchedDate: new Date(`2024-0${i}-01`) }));
      }
      const service = buildService();

      const firstPage = await service.listInfinite(asUser(user), movie.id, {
        ...baseQuery,
        per_page: 2,
      });
      expect(firstPage.data.map((d) => d.id)).toEqual([dates[0].id, dates[1].id]);
      expect(firstPage.meta.next_cursor).not.toBeNull();

      const secondPage = await service.listInfinite(asUser(user), movie.id, {
        ...baseQuery,
        per_page: 2,
        cursor: firstPage.meta.next_cursor ?? undefined,
      });
      expect(secondPage.data.map((d) => d.id)).toEqual([dates[2].id]);
      expect(secondPage.meta.next_cursor).toBeNull();
    });

    it('sorts descending when requested', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const log = await createTestLogMovie(testDb.db, { userId: user.id, movieId: movie.id });
      const early = await insertWatchedDate(log.id, { watchedDate: new Date('2024-01-01') });
      const late = await insertWatchedDate(log.id, { watchedDate: new Date('2024-06-01') });
      const service = buildService();

      const result = await service.listInfinite(asUser(user), movie.id, {
        sort_by: WatchedDateSortBy.WATCHED_DATE,
        sort_order: SortOrder.DESC,
        per_page: 10,
      });

      expect(result.data.map((d) => d.id)).toEqual([late.id, early.id]);
    });
  });
});
