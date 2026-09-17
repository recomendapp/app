import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  createTestImportJob,
  createTestImportJobLogTvSeries,
  createTestImportJobReviewTvSeries,
  createTestUser,
  TestDatabase,
} from '@libs/testing';
import { User } from '../../../auth/auth.service';
import { ImportServerEvents } from '@libs/realtime';
import type { RealtimeGateway } from '../../../realtime/realtime.gateway';

jest.mock('../../../realtime/realtime.gateway', () => ({ RealtimeGateway: jest.fn() }));

const { ImportLogTvSeriesReviewsService } =
  require('./import-log-tv-series-reviews.service') as typeof import('./import-log-tv-series-reviews.service');

describe('ImportLogTvSeriesReviewsService', () => {
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
      const service = new ImportLogTvSeriesReviewsService(testDb.db, fakeGateway());

      await expect(service.get(asUser(user), 999, 1)).rejects.toThrow(NotFoundException);
    });

    it('throws when the job belongs to someone else', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: stranger } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: owner.id });
      const service = new ImportLogTvSeriesReviewsService(testDb.db, fakeGateway());

      await expect(service.get(asUser(stranger), job.id, 1)).rejects.toThrow(NotFoundException);
    });

    it('returns null when the log-tv-series item has no staged review', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: user.id });
      const item = await createTestImportJobLogTvSeries(testDb.db, { importJobId: job.id });
      const service = new ImportLogTvSeriesReviewsService(testDb.db, fakeGateway());

      await expect(service.get(asUser(user), job.id, item.id)).resolves.toBeNull();
    });

    it('returns the staged review', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: user.id });
      const item = await createTestImportJobLogTvSeries(testDb.db, { importJobId: job.id });
      const review = await createTestImportJobReviewTvSeries(
        testDb.db,
        { importJobLogTvSeriesId: item.id },
        { title: 'Great show', body: 'Loved it', isSpoiler: true },
      );
      const service = new ImportLogTvSeriesReviewsService(testDb.db, fakeGateway());

      const result = await service.get(asUser(user), job.id, item.id);

      expect(result?.id).toBe(review.id);
      expect(result?.title).toBe('Great show');
      expect(result?.body).toBe('Loved it');
      expect(result?.isSpoiler).toBe(true);
    });

    it('returns null when the review belongs to a log-tv-series item of a different job', async () => {
      const { user } = await createTestUser(testDb.db);
      const jobA = await createTestImportJob(testDb.db, { userId: user.id });
      const jobB = await createTestImportJob(testDb.db, { userId: user.id });
      const itemInJobB = await createTestImportJobLogTvSeries(testDb.db, { importJobId: jobB.id });
      await createTestImportJobReviewTvSeries(testDb.db, { importJobLogTvSeriesId: itemInJobB.id });
      const service = new ImportLogTvSeriesReviewsService(testDb.db, fakeGateway());

      await expect(service.get(asUser(user), jobA.id, itemInJobB.id)).resolves.toBeNull();
    });
  });

  describe('patch', () => {
    it('throws when the job is not found or not owned', async () => {
      const { user } = await createTestUser(testDb.db);
      const service = new ImportLogTvSeriesReviewsService(testDb.db, fakeGateway());

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
      const item = await createTestImportJobLogTvSeries(testDb.db, { importJobId: job.id });
      await createTestImportJobReviewTvSeries(testDb.db, { importJobLogTvSeriesId: item.id });
      const service = new ImportLogTvSeriesReviewsService(testDb.db, fakeGateway());

      await expect(
        service.patch(asUser(user), job.id, item.id, { resolution: 'keep_existing' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when there is no staged review for the item', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: user.id });
      const item = await createTestImportJobLogTvSeries(testDb.db, { importJobId: job.id });
      const service = new ImportLogTvSeriesReviewsService(testDb.db, fakeGateway());

      await expect(
        service.patch(asUser(user), job.id, item.id, { resolution: 'keep_existing' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('sets resolution to keep_existing', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: user.id });
      const item = await createTestImportJobLogTvSeries(testDb.db, { importJobId: job.id });
      await createTestImportJobReviewTvSeries(testDb.db, { importJobLogTvSeriesId: item.id });
      const service = new ImportLogTvSeriesReviewsService(testDb.db, fakeGateway());

      const result = await service.patch(asUser(user), job.id, item.id, {
        resolution: 'keep_existing',
      });

      expect(result.resolution).toBe('keep_existing');
    });

    it('sets resolution to use_imported', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: user.id });
      const item = await createTestImportJobLogTvSeries(testDb.db, { importJobId: job.id });
      await createTestImportJobReviewTvSeries(testDb.db, { importJobLogTvSeriesId: item.id });
      const service = new ImportLogTvSeriesReviewsService(testDb.db, fakeGateway());

      const result = await service.patch(asUser(user), job.id, item.id, {
        resolution: 'use_imported',
      });

      expect(result.resolution).toBe('use_imported');
    });

    it('emits a LOG_TV_SERIES_REVIEW_PATCHED realtime event', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: user.id });
      const item = await createTestImportJobLogTvSeries(testDb.db, { importJobId: job.id });
      await createTestImportJobReviewTvSeries(testDb.db, { importJobLogTvSeriesId: item.id });
      const gateway = fakeGateway();
      const service = new ImportLogTvSeriesReviewsService(testDb.db, gateway);

      const result = await service.patch(asUser(user), job.id, item.id, {
        resolution: 'use_imported',
      });

      expect(gateway.emitToUser).toHaveBeenCalledWith(
        user.id,
        ImportServerEvents.LOG_TV_SERIES_REVIEW_PATCHED,
        { importJobId: job.id, itemId: item.id, review: result },
      );
    });
  });
});
