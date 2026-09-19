import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  createTestImportJob,
  createTestImportJobLogMovie,
  createTestImportJobReviewMovie,
  createTestUser,
  TestDatabase,
} from '@libs/testing';
import { User } from '../../../auth/auth.service';
import { ImportServerEvents } from '@libs/realtime';
import type { RealtimeGateway } from '../../../realtime/realtime.gateway';

jest.mock('../../../realtime/realtime.gateway', () => ({ RealtimeGateway: jest.fn() }));

const { ImportLogMovieReviewsService } =
  require('./import-log-movie-reviews.service') as typeof import('./import-log-movie-reviews.service');

describe('ImportLogMovieReviewsService', () => {
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

  describe('get', () => {
    it('throws when the job is not found or not owned', async () => {
      const { user } = await createTestUser(testDb.db);
      const service = new ImportLogMovieReviewsService(testDb.db, fakeGateway());

      await expect(service.get(asUser(user), 999, 1)).rejects.toThrow(NotFoundException);
    });

    it('throws when the job belongs to someone else', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: stranger } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: owner.id });
      const service = new ImportLogMovieReviewsService(testDb.db, fakeGateway());

      await expect(service.get(asUser(stranger), job.id, 1)).rejects.toThrow(NotFoundException);
    });

    it('returns null when the log-movie item has no staged review', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: user.id });
      const item = await createTestImportJobLogMovie(testDb.db, { importJobId: job.id });
      const service = new ImportLogMovieReviewsService(testDb.db, fakeGateway());

      await expect(service.get(asUser(user), job.id, item.id)).resolves.toBeNull();
    });

    it('returns the staged review', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: user.id });
      const item = await createTestImportJobLogMovie(testDb.db, { importJobId: job.id });
      const review = await createTestImportJobReviewMovie(
        testDb.db,
        { importJobLogMovieId: item.id },
        {
          title: 'Great flick',
          body: 'Loved it',
          isSpoiler: true,
        },
      );
      const service = new ImportLogMovieReviewsService(testDb.db, fakeGateway());

      const result = await service.get(asUser(user), job.id, item.id);

      expect(result?.id).toBe(review.id);
      expect(result?.title).toBe('Great flick');
      expect(result?.body).toBe('Loved it');
      expect(result?.isSpoiler).toBe(true);
    });

    it('returns null when the review belongs to a log-movie item of a different job', async () => {
      const { user } = await createTestUser(testDb.db);
      const jobA = await createTestImportJob(testDb.db, { userId: user.id });
      const jobB = await createTestImportJob(testDb.db, { userId: user.id });
      const itemInJobB = await createTestImportJobLogMovie(testDb.db, { importJobId: jobB.id });
      await createTestImportJobReviewMovie(testDb.db, { importJobLogMovieId: itemInJobB.id });
      const service = new ImportLogMovieReviewsService(testDb.db, fakeGateway());

      // Same itemId, but requested under jobA — must not leak jobB's review.
      await expect(service.get(asUser(user), jobA.id, itemInJobB.id)).resolves.toBeNull();
    });
  });

  describe('patch', () => {
    it('throws when the job is not found or not owned', async () => {
      const { user } = await createTestUser(testDb.db);
      const service = new ImportLogMovieReviewsService(testDb.db, fakeGateway());

      await expect(
        service.patch(asUser(user), 999, 1, { resolution: 'keep_existing' }),
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
      await createTestImportJobReviewMovie(testDb.db, { importJobLogMovieId: item.id });
      const service = new ImportLogMovieReviewsService(testDb.db, fakeGateway());

      await expect(
        service.patch(asUser(user), job.id, item.id, { resolution: 'keep_existing' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when there is no staged review for the item', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: user.id });
      const item = await createTestImportJobLogMovie(testDb.db, { importJobId: job.id });
      const service = new ImportLogMovieReviewsService(testDb.db, fakeGateway());

      await expect(
        service.patch(asUser(user), job.id, item.id, { resolution: 'keep_existing' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('sets resolution to keep_existing', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: user.id });
      const item = await createTestImportJobLogMovie(testDb.db, { importJobId: job.id });
      await createTestImportJobReviewMovie(testDb.db, { importJobLogMovieId: item.id });
      const service = new ImportLogMovieReviewsService(testDb.db, fakeGateway());

      const result = await service.patch(asUser(user), job.id, item.id, {
        resolution: 'keep_existing',
      });

      expect(result.resolution).toBe('keep_existing');
    });

    it('sets resolution to use_imported', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: user.id });
      const item = await createTestImportJobLogMovie(testDb.db, { importJobId: job.id });
      await createTestImportJobReviewMovie(testDb.db, { importJobLogMovieId: item.id });
      const service = new ImportLogMovieReviewsService(testDb.db, fakeGateway());

      const result = await service.patch(asUser(user), job.id, item.id, {
        resolution: 'use_imported',
      });

      expect(result.resolution).toBe('use_imported');
    });

    it('emits a LOG_MOVIE_REVIEW_PATCHED realtime event', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: user.id });
      const item = await createTestImportJobLogMovie(testDb.db, { importJobId: job.id });
      await createTestImportJobReviewMovie(testDb.db, { importJobLogMovieId: item.id });
      const gateway = fakeGateway();
      const service = new ImportLogMovieReviewsService(testDb.db, gateway);

      const result = await service.patch(asUser(user), job.id, item.id, {
        resolution: 'use_imported',
      });

      expect(gateway.emitToUser).toHaveBeenCalledWith(
        user.id,
        ImportServerEvents.LOG_MOVIE_REVIEW_PATCHED,
        { importJobId: job.id, itemId: item.id, review: result },
      );
    });
  });
});
