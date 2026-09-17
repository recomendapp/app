import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  createTestImportJob,
  createTestImportJobLogMovie,
  createTestImportJobReviewMovie,
  createTestMovie,
  createTestUser,
  TestDatabase,
} from '@libs/testing';
import { defaultSupportedLocale } from '@libs/i18n';
import { User } from '../../auth/auth.service';
import { ImportServerEvents } from '@libs/realtime';
import type { RealtimeGateway } from '../../realtime/realtime.gateway';

jest.mock('../../realtime/realtime.gateway', () => ({ RealtimeGateway: jest.fn() }));

const { ImportLogMoviesService } =
  require('./import-log-movies.service') as typeof import('./import-log-movies.service');

describe('ImportLogMoviesService', () => {
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

  describe('listAll', () => {
    it('throws when the job is not found or not owned', async () => {
      const { user } = await createTestUser(testDb.db);
      const service = new ImportLogMoviesService(testDb.db, fakeGateway());

      await expect(service.listAll(asUser(user), 999, defaultSupportedLocale)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns an empty array for a job with no staged log-movies', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: user.id });
      const service = new ImportLogMoviesService(testDb.db, fakeGateway());

      await expect(service.listAll(asUser(user), job.id, defaultSupportedLocale)).resolves.toEqual(
        [],
      );
    });

    it('lists staged log-movies ordered by id, with movie media and review attached', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: user.id });
      const movie = await createTestMovie(testDb.db);
      const first = await createTestImportJobLogMovie(testDb.db, {
        importJobId: job.id,
        movieId: movie.id,
      });
      const review = await createTestImportJobReviewMovie(testDb.db, {
        importJobLogMovieId: first.id,
      });
      const second = await createTestImportJobLogMovie(testDb.db, { importJobId: job.id });
      const service = new ImportLogMoviesService(testDb.db, fakeGateway());

      const result = await service.listAll(asUser(user), job.id, defaultSupportedLocale);

      expect(result.map((r) => r.id)).toEqual([first.id, second.id]);
      expect(result[0].movie?.id).toBe(movie.id);
      expect(result[0].review?.id).toBe(review.id);
      expect(result[1].movie).toBeNull();
      expect(result[1].review).toBeFalsy();
    });

    it('does not leak another job staged log-movies', async () => {
      const { user } = await createTestUser(testDb.db);
      const jobA = await createTestImportJob(testDb.db, { userId: user.id });
      const jobB = await createTestImportJob(testDb.db, { userId: user.id });
      await createTestImportJobLogMovie(testDb.db, { importJobId: jobB.id });
      const service = new ImportLogMoviesService(testDb.db, fakeGateway());

      await expect(service.listAll(asUser(user), jobA.id, defaultSupportedLocale)).resolves.toEqual(
        [],
      );
    });
  });

  describe('listPaginated', () => {
    it('paginates results and reports accurate meta', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: user.id });
      const items = [];
      for (let i = 0; i < 3; i++) {
        items.push(await createTestImportJobLogMovie(testDb.db, { importJobId: job.id }));
      }
      const service = new ImportLogMoviesService(testDb.db, fakeGateway());

      const page1 = await service.listPaginated(
        asUser(user),
        job.id,
        { page: 1, per_page: 2 },
        defaultSupportedLocale,
      );
      expect(page1.data.map((r) => r.id)).toEqual([items[0].id, items[1].id]);
      expect(page1.meta).toEqual({
        total_results: 3,
        total_pages: 2,
        current_page: 1,
        per_page: 2,
      });

      const page2 = await service.listPaginated(
        asUser(user),
        job.id,
        { page: 2, per_page: 2 },
        defaultSupportedLocale,
      );
      expect(page2.data.map((r) => r.id)).toEqual([items[2].id]);
    });

    it('throws when the job is not found or not owned', async () => {
      const { user } = await createTestUser(testDb.db);
      const service = new ImportLogMoviesService(testDb.db, fakeGateway());

      await expect(
        service.listPaginated(asUser(user), 999, { page: 1, per_page: 10 }, defaultSupportedLocale),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('listInfinite', () => {
    it('paginates with a cursor until there is no next page', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: user.id });
      const items = [];
      for (let i = 0; i < 3; i++) {
        items.push(await createTestImportJobLogMovie(testDb.db, { importJobId: job.id }));
      }
      const service = new ImportLogMoviesService(testDb.db, fakeGateway());

      const firstPage = await service.listInfinite(
        asUser(user),
        job.id,
        { per_page: 2 },
        defaultSupportedLocale,
      );
      expect(firstPage.data.map((r) => r.id)).toEqual([items[0].id, items[1].id]);
      expect(firstPage.meta.next_cursor).not.toBeNull();

      const secondPage = await service.listInfinite(
        asUser(user),
        job.id,
        { per_page: 2, cursor: firstPage.meta.next_cursor ?? undefined },
        defaultSupportedLocale,
      );
      expect(secondPage.data.map((r) => r.id)).toEqual([items[2].id]);
      expect(secondPage.meta.next_cursor).toBeNull();
    });

    it('includes the total count only on the first page when requested', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: user.id });
      await createTestImportJobLogMovie(testDb.db, { importJobId: job.id });
      await createTestImportJobLogMovie(testDb.db, { importJobId: job.id });
      const service = new ImportLogMoviesService(testDb.db, fakeGateway());

      const firstPage = await service.listInfinite(
        asUser(user),
        job.id,
        { per_page: 1, include_total_count: true },
        defaultSupportedLocale,
      );
      expect(firstPage.meta.total_results).toBe(2);

      const secondPage = await service.listInfinite(
        asUser(user),
        job.id,
        { per_page: 1, include_total_count: true, cursor: firstPage.meta.next_cursor ?? undefined },
        defaultSupportedLocale,
      );
      expect(secondPage.meta.total_results).toBeUndefined();
    });

    it('rejects a cursor that is not valid base64-encoded JSON', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: user.id });
      const service = new ImportLogMoviesService(testDb.db, fakeGateway());

      await expect(
        service.listInfinite(
          asUser(user),
          job.id,
          { per_page: 10, cursor: 'not-a-valid-cursor' },
          defaultSupportedLocale,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a cursor that decodes to the wrong shape', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: user.id });
      const wrongShapeCursor = Buffer.from(JSON.stringify({ foo: 'bar' })).toString('base64');
      const service = new ImportLogMoviesService(testDb.db, fakeGateway());

      await expect(
        service.listInfinite(
          asUser(user),
          job.id,
          { per_page: 10, cursor: wrongShapeCursor },
          defaultSupportedLocale,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when the job is not found or not owned', async () => {
      const { user } = await createTestUser(testDb.db);
      const service = new ImportLogMoviesService(testDb.db, fakeGateway());

      await expect(
        service.listInfinite(asUser(user), 999, { per_page: 10 }, defaultSupportedLocale),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('patch', () => {
    it('throws when the job is not found or not owned', async () => {
      const { user } = await createTestUser(testDb.db);
      const service = new ImportLogMoviesService(testDb.db, fakeGateway());

      await expect(
        service.patch(asUser(user), 999, 1, { matchStatus: 'skipped' }, defaultSupportedLocale),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws when the job is not awaiting_review', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(
        testDb.db,
        { userId: user.id },
        { status: 'completed' },
      );
      const item = await createTestImportJobLogMovie(testDb.db, { importJobId: job.id });
      const service = new ImportLogMoviesService(testDb.db, fakeGateway());

      await expect(
        service.patch(
          asUser(user),
          job.id,
          item.id,
          { matchStatus: 'skipped' },
          defaultSupportedLocale,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when the item does not exist in that job', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: user.id });
      const service = new ImportLogMoviesService(testDb.db, fakeGateway());

      await expect(
        service.patch(
          asUser(user),
          job.id,
          999,
          { matchStatus: 'skipped' },
          defaultSupportedLocale,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('sets movieId and marks matched', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: user.id });
      const item = await createTestImportJobLogMovie(testDb.db, { importJobId: job.id });
      const movie = await createTestMovie(testDb.db);
      const service = new ImportLogMoviesService(testDb.db, fakeGateway());

      const result = await service.patch(
        asUser(user),
        job.id,
        item.id,
        { movieId: movie.id },
        defaultSupportedLocale,
      );

      expect(result.movieId).toBe(movie.id);
      expect(result.matchStatus).toBe('matched');
      expect(result.movie?.id).toBe(movie.id);
    });

    it('sets the conflict resolution', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: user.id });
      const item = await createTestImportJobLogMovie(testDb.db, { importJobId: job.id });
      const service = new ImportLogMoviesService(testDb.db, fakeGateway());

      const result = await service.patch(
        asUser(user),
        job.id,
        item.id,
        { resolution: 'merge' },
        defaultSupportedLocale,
      );

      expect(result.resolution).toBe('merge');
    });

    it('sets matchStatus to skipped', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: user.id });
      const item = await createTestImportJobLogMovie(testDb.db, { importJobId: job.id });
      const service = new ImportLogMoviesService(testDb.db, fakeGateway());

      const result = await service.patch(
        asUser(user),
        job.id,
        item.id,
        { matchStatus: 'skipped' },
        defaultSupportedLocale,
      );

      expect(result.matchStatus).toBe('skipped');
    });

    it('emits a LOG_MOVIE_PATCHED realtime event', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: user.id });
      const item = await createTestImportJobLogMovie(testDb.db, { importJobId: job.id });
      const gateway = fakeGateway();
      const service = new ImportLogMoviesService(testDb.db, gateway);

      const result = await service.patch(
        asUser(user),
        job.id,
        item.id,
        { matchStatus: 'skipped' },
        defaultSupportedLocale,
      );

      expect(gateway.emitToUser).toHaveBeenCalledWith(
        user.id,
        ImportServerEvents.LOG_MOVIE_PATCHED,
        {
          importJobId: job.id,
          item: result,
        },
      );
    });
  });
});
