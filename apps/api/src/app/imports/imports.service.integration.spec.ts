import { BadRequestException, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import {
  bookmark,
  importJob,
  logMovie,
  logTvEpisode,
  logTvSeason,
  logTvSeries,
  playlist,
  playlistItem,
  reviewMovie,
  reviewTvSeries,
  tmdbTvEpisode,
  tmdbTvSeason,
} from '@libs/db/schemas';
import {
  createTestImportJob,
  createTestImportJobBookmark,
  createTestImportJobLogMovie,
  createTestImportJobLogMovieWatchedDate,
  createTestImportJobLogTvSeries,
  createTestImportJobPlaylist,
  createTestImportJobPlaylistItem,
  createTestImportJobReviewMovie,
  createTestImportJobReviewTvSeries,
  createTestMovie,
  createTestProvider,
  createTestTvSeries,
  createTestUser,
  createFakeNotifyClient,
  TestDatabase,
} from '@libs/testing';
import { User } from '../auth/auth.service';
import { ImportServerEvents } from '@libs/realtime';
import type { RealtimeGateway } from '../realtime/realtime.gateway';
import type { TransfersStorageService } from '../../common/modules/transfers-storage/transfers-storage.service';
import type { PrefectService } from '../../common/modules/prefect/prefect.service';
import type { MultipartFile } from '@fastify/multipart';

jest.mock('../realtime/realtime.gateway', () => ({ RealtimeGateway: jest.fn() }));

const { ImportsService } = require('./imports.service') as typeof import('./imports.service');
const { TvLogsSyncService } =
  require('../tv-series/logs/sync/tv-logs-sync.service') as typeof import('../tv-series/logs/sync/tv-logs-sync.service');
const { RecosService } =
  require('../recos/recos.service') as typeof import('../recos/recos.service');
const { UserRecosService } =
  require('../users/recos/user-recos.service') as typeof import('../users/recos/user-recos.service');

describe('ImportsService', () => {
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

  function fakeTransfersStorage(overrides?: Partial<jest.Mocked<TransfersStorageService>>) {
    return {
      uploadImportFile: jest.fn().mockResolvedValue({ key: 'fake/import/key.zip' }),
      deleteFile: jest.fn().mockResolvedValue(undefined),
      ...overrides,
    } as unknown as jest.Mocked<TransfersStorageService>;
  }

  function fakePrefect(overrides?: Partial<jest.Mocked<PrefectService>>) {
    return {
      triggerImportFlow: jest.fn().mockResolvedValue({ id: 'run-id' }),
      ...overrides,
    } as unknown as jest.Mocked<PrefectService>;
  }

  function buildService(opts?: {
    transfersStorage?: jest.Mocked<TransfersStorageService>;
    prefect?: jest.Mocked<PrefectService>;
    gateway?: jest.Mocked<RealtimeGateway>;
  }) {
    const userRecosService = new UserRecosService(testDb.db);
    const recosService = new RecosService(
      testDb.db,
      createFakeNotifyClient(),
      fakeGateway(),
      userRecosService,
    );
    const tvLogsSyncService = new TvLogsSyncService(testDb.db, recosService);
    return new ImportsService(
      testDb.db,
      opts?.transfersStorage ?? fakeTransfersStorage(),
      opts?.prefect ?? fakePrefect(),
      tvLogsSyncService,
      opts?.gateway ?? fakeGateway(),
    );
  }

  async function waitForCall(mockFn: { mock: { calls: unknown[] } }, timeoutMs = 2000) {
    const start = Date.now();
    while (mockFn.mock.calls.length === 0) {
      if (Date.now() - start > timeoutMs)
        throw new Error('Timed out waiting for mock to be called');
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }

  const fakeFile = {} as MultipartFile;

  /* -------------------------------------------------------------------------- */
  /* create                                                                     */
  /* -------------------------------------------------------------------------- */
  describe('create', () => {
    it('throws for an unknown provider', async () => {
      const { user } = await createTestUser(testDb.db);
      const service = buildService();

      await expect(service.create(asUser(user), 'unknown-provider', fakeFile)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws when the user already has an active import', async () => {
      const { user } = await createTestUser(testDb.db);
      const provider = await createTestProvider(testDb.db);
      await createTestImportJob(
        testDb.db,
        { userId: user.id, providerId: provider.id },
        { status: 'processing' },
      );
      const service = buildService();

      await expect(service.create(asUser(user), provider.slug, fakeFile)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('allows a new import once the previous one is completed', async () => {
      const { user } = await createTestUser(testDb.db);
      const provider = await createTestProvider(testDb.db);
      await createTestImportJob(
        testDb.db,
        { userId: user.id, providerId: provider.id },
        { status: 'completed' },
      );
      const service = buildService();

      await expect(service.create(asUser(user), provider.slug, fakeFile)).resolves.toBeDefined();
    });

    it('uploads the file, marks the job processing, and triggers the Prefect flow', async () => {
      const { user } = await createTestUser(testDb.db);
      const provider = await createTestProvider(testDb.db, { slug: 'letterboxd-test' });
      const transfersStorage = fakeTransfersStorage();
      const prefect = fakePrefect();
      const service = buildService({ transfersStorage, prefect });

      const result = await service.create(asUser(user), provider.slug, fakeFile);

      expect(result.status).toBe('processing');
      expect(result.provider).toBe(provider.slug);
      expect(transfersStorage.uploadImportFile).toHaveBeenCalledWith(user.id, result.id, fakeFile);
      await waitForCall(prefect.triggerImportFlow);
      expect(prefect.triggerImportFlow).toHaveBeenCalledWith({
        importId: result.id,
        userId: user.id,
        s3Key: 'fake/import/key.zip',
        provider: provider.slug,
      });
    });

    it('emits a CREATED realtime event', async () => {
      const { user } = await createTestUser(testDb.db);
      const provider = await createTestProvider(testDb.db);
      const gateway = fakeGateway();
      const service = buildService({ gateway });

      const result = await service.create(asUser(user), provider.slug, fakeFile);

      expect(gateway.emitToUser).toHaveBeenCalledWith(user.id, ImportServerEvents.CREATED, result);
    });

    it('marks the job failed and emits FAILED when triggering the Prefect flow fails', async () => {
      const { user } = await createTestUser(testDb.db);
      const provider = await createTestProvider(testDb.db);
      const prefect = fakePrefect({
        triggerImportFlow: jest.fn().mockRejectedValue(new Error('boom')),
      });
      const gateway = fakeGateway();
      const service = buildService({ prefect, gateway });

      const created = await service.create(asUser(user), provider.slug, fakeFile);

      await waitForCall(gateway.emitToUser);
      const [row] = await testDb.db.select().from(importJob).where(eq(importJob.id, created.id));
      expect(row.status).toBe('failed');
      expect(row.error).toBe('Failed to start processing');
      expect(gateway.emitToUser).toHaveBeenCalledWith(user.id, ImportServerEvents.FAILED, {
        importId: created.id,
        error: 'Failed to start processing',
      });
    });
  });

  /* -------------------------------------------------------------------------- */
  /* list / get / delete                                                       */
  /* -------------------------------------------------------------------------- */
  describe('listing, getById and delete', () => {
    it('scopes listAll to the current user and flattens the provider slug', async () => {
      const { user } = await createTestUser(testDb.db);
      const { user: other } = await createTestUser(testDb.db);
      const provider = await createTestProvider(testDb.db, { slug: 'trakt-test' });
      const mine = await createTestImportJob(testDb.db, {
        userId: user.id,
        providerId: provider.id,
      });
      await createTestImportJob(testDb.db, { userId: other.id });
      const service = buildService();

      const result = await service.listAll(asUser(user));

      expect(result.map((r) => r.id)).toEqual([mine.id]);
      expect(result[0].provider).toBe('trakt-test');
    });

    it('paginates results and reports accurate meta', async () => {
      const { user } = await createTestUser(testDb.db);
      const jobs = [];
      for (let i = 0; i < 3; i++) {
        jobs.push(await createTestImportJob(testDb.db, { userId: user.id }));
      }
      const service = buildService();

      const page1 = await service.listPaginated(asUser(user), { page: 1, per_page: 2 });
      expect(page1.data.map((r) => r.id)).toEqual([jobs[2].id, jobs[1].id]);
      expect(page1.meta).toEqual({
        total_results: 3,
        total_pages: 2,
        current_page: 1,
        per_page: 2,
      });
    });

    it('paginates with a cursor until there is no next page', async () => {
      const { user } = await createTestUser(testDb.db);
      const jobs = [];
      for (let i = 0; i < 3; i++) {
        jobs.push(await createTestImportJob(testDb.db, { userId: user.id }));
      }
      const service = buildService();

      const firstPage = await service.listInfinite(asUser(user), { per_page: 2 });
      expect(firstPage.data.map((r) => r.id)).toEqual([jobs[2].id, jobs[1].id]);
      expect(firstPage.meta.next_cursor).not.toBeNull();

      const secondPage = await service.listInfinite(asUser(user), {
        per_page: 2,
        cursor: firstPage.meta.next_cursor ?? undefined,
      });
      expect(secondPage.data.map((r) => r.id)).toEqual([jobs[0].id]);
      expect(secondPage.meta.next_cursor).toBeNull();
    });

    it('rejects a malformed cursor', async () => {
      const { user } = await createTestUser(testDb.db);
      const service = buildService();

      await expect(
        service.listInfinite(asUser(user), { per_page: 10, cursor: 'not-a-valid-cursor' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('getById throws for a job owned by another user', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: stranger } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: owner.id });
      const service = buildService();

      await expect(service.getById(asUser(stranger), job.id)).rejects.toThrow(NotFoundException);
    });

    it('deletes an owned job and deletes its uploaded file', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(
        testDb.db,
        { userId: user.id },
        { fileKey: 'some/key.zip' },
      );
      const transfersStorage = fakeTransfersStorage();
      const gateway = fakeGateway();
      const service = buildService({ transfersStorage, gateway });

      await service.delete(asUser(user), job.id);

      const rows = await testDb.db.select().from(importJob).where(eq(importJob.id, job.id));
      expect(rows).toHaveLength(0);
      await waitForCall(transfersStorage.deleteFile);
      expect(transfersStorage.deleteFile).toHaveBeenCalledWith('some/key.zip');
      expect(gateway.emitToUser).toHaveBeenCalledWith(user.id, ImportServerEvents.DELETED, {
        importId: job.id,
        userId: user.id,
      });
    });

    it('does not try to delete a file when the job has none', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: user.id }, { fileKey: null });
      const transfersStorage = fakeTransfersStorage();
      const service = buildService({ transfersStorage });

      await service.delete(asUser(user), job.id);

      expect(transfersStorage.deleteFile).not.toHaveBeenCalled();
    });

    it('throws when deleting a job owned by another user', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: stranger } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: owner.id });
      const service = buildService();

      await expect(service.delete(asUser(stranger), job.id)).rejects.toThrow(NotFoundException);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* validate                                                                   */
  /* -------------------------------------------------------------------------- */
  describe('validate', () => {
    it('throws when the job is not found or not owned', async () => {
      const service = buildService();
      const { user } = await createTestUser(testDb.db);

      await expect(service.validate(asUser(user), 999)).rejects.toThrow(NotFoundException);
    });

    it('throws when the job is not awaiting_review', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(
        testDb.db,
        { userId: user.id },
        { status: 'processing' },
      );
      const service = buildService();

      await expect(service.validate(asUser(user), job.id)).rejects.toThrow(BadRequestException);
    });

    it('marks the job completed and emits VALIDATED', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: user.id });
      const gateway = fakeGateway();
      const service = buildService({ gateway });

      const result = await service.validate(asUser(user), job.id);

      expect(result.status).toBe('completed');
      expect(gateway.emitToUser).toHaveBeenCalledWith(
        user.id,
        ImportServerEvents.VALIDATED,
        result,
      );
    });

    describe('log movies', () => {
      it('skips items marked skipped', async () => {
        const { user } = await createTestUser(testDb.db);
        const job = await createTestImportJob(testDb.db, { userId: user.id });
        const movie = await createTestMovie(testDb.db);
        await createTestImportJobLogMovie(
          testDb.db,
          { importJobId: job.id, movieId: movie.id },
          { matchStatus: 'skipped' },
        );
        const service = buildService();

        await service.validate(asUser(user), job.id);

        const rows = await testDb.db.select().from(logMovie).where(eq(logMovie.userId, user.id));
        expect(rows).toHaveLength(0);
      });

      it('skips unmatched items (no movieId)', async () => {
        const { user } = await createTestUser(testDb.db);
        const job = await createTestImportJob(testDb.db, { userId: user.id });
        await createTestImportJobLogMovie(testDb.db, { importJobId: job.id, movieId: null });
        const service = buildService();

        await service.validate(asUser(user), job.id);

        const rows = await testDb.db.select().from(logMovie).where(eq(logMovie.userId, user.id));
        expect(rows).toHaveLength(0);
      });

      it('creates a new logMovie with the imported rating and like', async () => {
        const { user } = await createTestUser(testDb.db);
        const job = await createTestImportJob(testDb.db, { userId: user.id });
        const movie = await createTestMovie(testDb.db);
        await createTestImportJobLogMovie(
          testDb.db,
          { importJobId: job.id, movieId: movie.id },
          { importedRating: 8.5, importedIsLiked: true },
        );
        const service = buildService();

        await service.validate(asUser(user), job.id);

        const [row] = await testDb.db
          .select()
          .from(logMovie)
          .where(and(eq(logMovie.userId, user.id), eq(logMovie.movieId, movie.id)));
        expect(row.rating).toBe(8.5);
        expect(row.isLiked).toBe(true);
      });

      it('inserts non-duplicate watched dates and resyncs watch aggregates', async () => {
        const { user } = await createTestUser(testDb.db);
        const job = await createTestImportJob(testDb.db, { userId: user.id });
        const movie = await createTestMovie(testDb.db);
        const staged = await createTestImportJobLogMovie(testDb.db, {
          importJobId: job.id,
          movieId: movie.id,
        });
        await createTestImportJobLogMovieWatchedDate(
          testDb.db,
          { importJobLogMovieId: staged.id },
          {
            watchedDate: '2024-01-01',
            isDuplicate: false,
          },
        );
        await createTestImportJobLogMovieWatchedDate(
          testDb.db,
          { importJobLogMovieId: staged.id },
          {
            watchedDate: '2024-06-01',
            isDuplicate: false,
          },
        );
        await createTestImportJobLogMovieWatchedDate(
          testDb.db,
          { importJobLogMovieId: staged.id },
          {
            watchedDate: '2024-03-01',
            isDuplicate: true,
          },
        );
        const service = buildService();

        await service.validate(asUser(user), job.id);

        const [row] = await testDb.db
          .select()
          .from(logMovie)
          .where(and(eq(logMovie.userId, user.id), eq(logMovie.movieId, movie.id)));
        expect(row.watchCount).toBe(2);
        // `firstWatchedAt`/`lastWatchedAt` come back from a raw `min()`/`max()` SQL aggregate
        // over a timestamptz column, not through drizzle's date mapping, hence the full stamp.
        expect(row.firstWatchedAt).toContain('2024-01-01');
        expect(row.lastWatchedAt).toContain('2024-06-01');
      });

      it('re-checks conflicts live: use_imported overwrites the existing rating', async () => {
        const { user } = await createTestUser(testDb.db);
        const movie = await createTestMovie(testDb.db);
        await testDb.db.insert(logMovie).values({ userId: user.id, movieId: movie.id, rating: 3 });
        const job = await createTestImportJob(testDb.db, { userId: user.id });
        await createTestImportJobLogMovie(
          testDb.db,
          { importJobId: job.id, movieId: movie.id },
          { importedRating: 9, resolution: 'use_imported' },
        );
        const service = buildService();

        await service.validate(asUser(user), job.id);

        const rows = await testDb.db.select().from(logMovie).where(eq(logMovie.userId, user.id));
        expect(rows).toHaveLength(1);
        expect(rows[0].rating).toBe(9);
      });

      it('keep_existing (the default) never touches the existing rating', async () => {
        const { user } = await createTestUser(testDb.db);
        const movie = await createTestMovie(testDb.db);
        await testDb.db.insert(logMovie).values({ userId: user.id, movieId: movie.id, rating: 3 });
        const job = await createTestImportJob(testDb.db, { userId: user.id });
        await createTestImportJobLogMovie(
          testDb.db,
          { importJobId: job.id, movieId: movie.id },
          { importedRating: 9, resolution: null },
        );
        const service = buildService();

        await service.validate(asUser(user), job.id);

        const [row] = await testDb.db.select().from(logMovie).where(eq(logMovie.userId, user.id));
        expect(row.rating).toBe(3);
      });

      it('merge only fills the rating when the existing one is null', async () => {
        const { user } = await createTestUser(testDb.db);
        const ratedMovie = await createTestMovie(testDb.db);
        const unratedMovie = await createTestMovie(testDb.db);
        await testDb.db
          .insert(logMovie)
          .values({ userId: user.id, movieId: ratedMovie.id, rating: 3 });
        await testDb.db
          .insert(logMovie)
          .values({ userId: user.id, movieId: unratedMovie.id, rating: null });
        const job = await createTestImportJob(testDb.db, { userId: user.id });
        await createTestImportJobLogMovie(
          testDb.db,
          { importJobId: job.id, movieId: ratedMovie.id },
          { importedRating: 9, resolution: 'merge' },
        );
        await createTestImportJobLogMovie(
          testDb.db,
          { importJobId: job.id, movieId: unratedMovie.id },
          { importedRating: 9, resolution: 'merge' },
        );
        const service = buildService();

        await service.validate(asUser(user), job.id);

        const rows = await testDb.db.select().from(logMovie).where(eq(logMovie.userId, user.id));
        const rated = rows.find((r) => r.movieId === ratedMovie.id);
        const unrated = rows.find((r) => r.movieId === unratedMovie.id);
        expect(rated?.rating).toBe(3);
        expect(unrated?.rating).toBe(9);
      });

      it('never unsets an existing like', async () => {
        const { user } = await createTestUser(testDb.db);
        const movie = await createTestMovie(testDb.db);
        await testDb.db
          .insert(logMovie)
          .values({ userId: user.id, movieId: movie.id, isLiked: true });
        const job = await createTestImportJob(testDb.db, { userId: user.id });
        await createTestImportJobLogMovie(
          testDb.db,
          { importJobId: job.id, movieId: movie.id },
          { importedIsLiked: false },
        );
        const service = buildService();

        await service.validate(asUser(user), job.id);

        const [row] = await testDb.db.select().from(logMovie).where(eq(logMovie.userId, user.id));
        expect(row.isLiked).toBe(true);
      });

      it('creates the review when resolution is use_imported (default, no existing review)', async () => {
        const { user } = await createTestUser(testDb.db);
        const job = await createTestImportJob(testDb.db, { userId: user.id });
        const movie = await createTestMovie(testDb.db);
        const staged = await createTestImportJobLogMovie(testDb.db, {
          importJobId: job.id,
          movieId: movie.id,
        });
        await createTestImportJobReviewMovie(
          testDb.db,
          { importJobLogMovieId: staged.id },
          {
            title: '  My Review  ',
            body: 'Great movie',
          },
        );
        const service = buildService();

        await service.validate(asUser(user), job.id);

        const [logRow] = await testDb.db
          .select()
          .from(logMovie)
          .where(eq(logMovie.userId, user.id));
        const [reviewRow] = await testDb.db
          .select()
          .from(reviewMovie)
          .where(eq(reviewMovie.id, logRow.id));
        expect(reviewRow.body).toBe('Great movie');
        expect(reviewRow.title).toBe('My Review');
      });

      it('keep_existing leaves an existing review untouched', async () => {
        const { user } = await createTestUser(testDb.db);
        const movie = await createTestMovie(testDb.db);
        const [existingLog] = await testDb.db
          .insert(logMovie)
          .values({ userId: user.id, movieId: movie.id })
          .returning();
        await testDb.db.insert(reviewMovie).values({ id: existingLog.id, body: 'Original body' });
        const job = await createTestImportJob(testDb.db, { userId: user.id });
        const staged = await createTestImportJobLogMovie(testDb.db, {
          importJobId: job.id,
          movieId: movie.id,
        });
        await createTestImportJobReviewMovie(
          testDb.db,
          { importJobLogMovieId: staged.id },
          {
            body: 'Imported body',
            resolution: 'keep_existing',
          },
        );
        const service = buildService();

        await service.validate(asUser(user), job.id);

        const [reviewRow] = await testDb.db
          .select()
          .from(reviewMovie)
          .where(eq(reviewMovie.id, existingLog.id));
        expect(reviewRow.body).toBe('Original body');
      });
    });

    describe('log tv series', () => {
      it('skips items marked skipped', async () => {
        const { user } = await createTestUser(testDb.db);
        const job = await createTestImportJob(testDb.db, { userId: user.id });
        const tvSeries = await createTestTvSeries(testDb.db);
        await createTestImportJobLogTvSeries(
          testDb.db,
          { importJobId: job.id, tvSeriesId: tvSeries.id },
          { matchStatus: 'skipped' },
        );
        const service = buildService();

        await service.validate(asUser(user), job.id);

        const rows = await testDb.db
          .select()
          .from(logTvSeries)
          .where(eq(logTvSeries.userId, user.id));
        expect(rows).toHaveLength(0);
      });

      it('creates a new logTvSeries with the imported rating and like', async () => {
        const { user } = await createTestUser(testDb.db);
        const job = await createTestImportJob(testDb.db, { userId: user.id });
        const tvSeries = await createTestTvSeries(testDb.db);
        await createTestImportJobLogTvSeries(
          testDb.db,
          { importJobId: job.id, tvSeriesId: tvSeries.id },
          { importedRating: 7, importedIsLiked: true, importedStatus: 'dropped' },
        );
        const service = buildService();

        await service.validate(asUser(user), job.id);

        const [row] = await testDb.db
          .select()
          .from(logTvSeries)
          .where(and(eq(logTvSeries.userId, user.id), eq(logTvSeries.tvSeriesId, tvSeries.id)));
        expect(row.rating).toBe(7);
        expect(row.isLiked).toBe(true);
      });

      it('marks every season/episode watched when the import says "watched" (not dropped)', async () => {
        const { user } = await createTestUser(testDb.db);
        const job = await createTestImportJob(testDb.db, { userId: user.id });
        const tvSeries = await createTestTvSeries(testDb.db, { numberOfEpisodes: 1 });
        const season = await testDb.db
          .insert(tmdbTvSeason)
          .values({
            id: tvSeries.id * 10 + 1,
            tvSeriesId: tvSeries.id,
            seasonNumber: 1,
            episodeCount: 1,
            voteAverage: 0,
            voteCount: 0,
          })
          .returning();
        await testDb.db.insert(tmdbTvEpisode).values({
          id: tvSeries.id * 100 + 1,
          tvSeasonId: season[0].id,
          episodeNumber: 1,
          voteAverage: 0,
          voteCount: 0,
        });
        await createTestImportJobLogTvSeries(
          testDb.db,
          { importJobId: job.id, tvSeriesId: tvSeries.id },
          { importedStatus: 'watching' },
        );
        const service = buildService();

        await service.validate(asUser(user), job.id);

        const [logRow] = await testDb.db
          .select()
          .from(logTvSeries)
          .where(and(eq(logTvSeries.userId, user.id), eq(logTvSeries.tvSeriesId, tvSeries.id)));
        expect(logRow.episodesWatchedCount).toBe(1);

        const seasonRows = await testDb.db
          .select()
          .from(logTvSeason)
          .where(eq(logTvSeason.logTvSeriesId, logRow.id));
        expect(seasonRows).toHaveLength(1);

        const episodeRows = await testDb.db
          .select()
          .from(logTvEpisode)
          .where(eq(logTvEpisode.logTvSeriesId, logRow.id));
        expect(episodeRows).toHaveLength(1);
      });

      it('does not mark episodes watched when the import says "dropped"', async () => {
        const { user } = await createTestUser(testDb.db);
        const job = await createTestImportJob(testDb.db, { userId: user.id });
        const tvSeries = await createTestTvSeries(testDb.db, { numberOfEpisodes: 1 });
        const season = await testDb.db
          .insert(tmdbTvSeason)
          .values({
            id: tvSeries.id * 10 + 1,
            tvSeriesId: tvSeries.id,
            seasonNumber: 1,
            episodeCount: 1,
            voteAverage: 0,
            voteCount: 0,
          })
          .returning();
        await testDb.db.insert(tmdbTvEpisode).values({
          id: tvSeries.id * 100 + 1,
          tvSeasonId: season[0].id,
          episodeNumber: 1,
          voteAverage: 0,
          voteCount: 0,
        });
        await createTestImportJobLogTvSeries(
          testDb.db,
          { importJobId: job.id, tvSeriesId: tvSeries.id },
          { importedStatus: 'dropped' },
        );
        const service = buildService();

        await service.validate(asUser(user), job.id);

        const [logRow] = await testDb.db
          .select()
          .from(logTvSeries)
          .where(and(eq(logTvSeries.userId, user.id), eq(logTvSeries.tvSeriesId, tvSeries.id)));
        expect(logRow.status).toBe('dropped');

        const seasonRows = await testDb.db
          .select()
          .from(logTvSeason)
          .where(eq(logTvSeason.logTvSeriesId, logRow.id));
        expect(seasonRows).toHaveLength(0);
      });

      it('creates the review when resolution is use_imported', async () => {
        const { user } = await createTestUser(testDb.db);
        const job = await createTestImportJob(testDb.db, { userId: user.id });
        const tvSeries = await createTestTvSeries(testDb.db);
        const staged = await createTestImportJobLogTvSeries(
          testDb.db,
          { importJobId: job.id, tvSeriesId: tvSeries.id },
          { importedStatus: 'dropped' },
        );
        await createTestImportJobReviewTvSeries(
          testDb.db,
          { importJobLogTvSeriesId: staged.id },
          { body: 'Great show' },
        );
        const service = buildService();

        await service.validate(asUser(user), job.id);

        const [logRow] = await testDb.db
          .select()
          .from(logTvSeries)
          .where(eq(logTvSeries.userId, user.id));
        const [reviewRow] = await testDb.db
          .select()
          .from(reviewTvSeries)
          .where(eq(reviewTvSeries.id, logRow.id));
        expect(reviewRow.body).toBe('Great show');
      });
    });

    describe('bookmarks', () => {
      it('skips items marked skipped', async () => {
        const { user } = await createTestUser(testDb.db);
        const job = await createTestImportJob(testDb.db, { userId: user.id });
        const movie = await createTestMovie(testDb.db);
        await createTestImportJobBookmark(
          testDb.db,
          { importJobId: job.id, movieId: movie.id },
          { matchStatus: 'skipped' },
        );
        const service = buildService();

        await service.validate(asUser(user), job.id);

        const rows = await testDb.db.select().from(bookmark).where(eq(bookmark.userId, user.id));
        expect(rows).toHaveLength(0);
      });

      it('creates an active bookmark for a matched movie', async () => {
        const { user } = await createTestUser(testDb.db);
        const job = await createTestImportJob(testDb.db, { userId: user.id });
        const movie = await createTestMovie(testDb.db);
        await createTestImportJobBookmark(testDb.db, { importJobId: job.id, movieId: movie.id });
        const service = buildService();

        await service.validate(asUser(user), job.id);

        const [row] = await testDb.db.select().from(bookmark).where(eq(bookmark.userId, user.id));
        expect(row.movieId).toBe(movie.id);
        expect(row.status).toBe('active');
      });

      it('is a no-op when the user already has an active bookmark for that movie', async () => {
        const { user } = await createTestUser(testDb.db);
        const movie = await createTestMovie(testDb.db);
        await testDb.db
          .insert(bookmark)
          .values({ userId: user.id, movieId: movie.id, type: 'movie', status: 'active' });
        const job = await createTestImportJob(testDb.db, { userId: user.id });
        await createTestImportJobBookmark(testDb.db, { importJobId: job.id, movieId: movie.id });
        const service = buildService();

        await service.validate(asUser(user), job.id);

        const rows = await testDb.db.select().from(bookmark).where(eq(bookmark.userId, user.id));
        expect(rows).toHaveLength(1);
      });
    });

    describe('playlists', () => {
      it('skips a playlist marked skipped entirely', async () => {
        const { user } = await createTestUser(testDb.db);
        const job = await createTestImportJob(testDb.db, { userId: user.id });
        const staged = await createTestImportJobPlaylist(
          testDb.db,
          { importJobId: job.id },
          { matchStatus: 'skipped' },
        );
        const movie = await createTestMovie(testDb.db);
        await createTestImportJobPlaylistItem(testDb.db, {
          importJobPlaylistId: staged.id,
          movieId: movie.id,
        });
        const service = buildService();

        await service.validate(asUser(user), job.id);

        const rows = await testDb.db.select().from(playlist).where(eq(playlist.userId, user.id));
        expect(rows).toHaveLength(0);
      });

      it('does not create a playlist when every item is skipped or unmatched', async () => {
        const { user } = await createTestUser(testDb.db);
        const job = await createTestImportJob(testDb.db, { userId: user.id });
        const staged = await createTestImportJobPlaylist(testDb.db, { importJobId: job.id });
        await createTestImportJobPlaylistItem(
          testDb.db,
          { importJobPlaylistId: staged.id },
          { matchStatus: 'skipped' },
        );
        await createTestImportJobPlaylistItem(
          testDb.db,
          { importJobPlaylistId: staged.id },
          { matchStatus: 'unmatched' },
        );
        const service = buildService();

        await service.validate(asUser(user), job.id);

        const rows = await testDb.db.select().from(playlist).where(eq(playlist.userId, user.id));
        expect(rows).toHaveLength(0);
      });

      it('creates a private playlist with only the matched items, in source order', async () => {
        const { user } = await createTestUser(testDb.db);
        const job = await createTestImportJob(testDb.db, { userId: user.id });
        const staged = await createTestImportJobPlaylist(
          testDb.db,
          { importJobId: job.id },
          {
            title: 'My Ranked List',
            description: '  A great list  ',
          },
        );
        const movieA = await createTestMovie(testDb.db);
        const movieB = await createTestMovie(testDb.db);
        await createTestImportJobPlaylistItem(testDb.db, {
          importJobPlaylistId: staged.id,
          movieId: movieA.id,
          sourceOrder: 0,
        });
        await createTestImportJobPlaylistItem(
          testDb.db,
          { importJobPlaylistId: staged.id },
          { matchStatus: 'skipped', sourceOrder: 1 },
        );
        await createTestImportJobPlaylistItem(testDb.db, {
          importJobPlaylistId: staged.id,
          movieId: movieB.id,
          sourceOrder: 2,
        });
        const service = buildService();

        await service.validate(asUser(user), job.id);

        const [createdPlaylist] = await testDb.db
          .select()
          .from(playlist)
          .where(eq(playlist.userId, user.id));
        expect(createdPlaylist.title).toBe('My Ranked List');
        expect(createdPlaylist.description).toBe('A great list');
        expect(createdPlaylist.visibility).toBe('private');

        const items = await testDb.db
          .select()
          .from(playlistItem)
          .where(eq(playlistItem.playlistId, createdPlaylist.id))
          .orderBy(playlistItem.rank);
        expect(items).toHaveLength(2);
        expect(items.map((i) => i.movieId)).toEqual([movieA.id, movieB.id]);
      });

      it('defaults a blank title to "Imported playlist"', async () => {
        const { user } = await createTestUser(testDb.db);
        const job = await createTestImportJob(testDb.db, { userId: user.id });
        const staged = await createTestImportJobPlaylist(
          testDb.db,
          { importJobId: job.id },
          { title: '   ' },
        );
        const movie = await createTestMovie(testDb.db);
        await createTestImportJobPlaylistItem(testDb.db, {
          importJobPlaylistId: staged.id,
          movieId: movie.id,
        });
        const service = buildService();

        await service.validate(asUser(user), job.id);

        const [createdPlaylist] = await testDb.db
          .select()
          .from(playlist)
          .where(eq(playlist.userId, user.id));
        expect(createdPlaylist.title).toBe('Imported playlist');
      });
    });
  });

  /* -------------------------------------------------------------------------- */
  /* recordEvent (internal, called by Prefect)                                 */
  /* -------------------------------------------------------------------------- */
  describe('recordEvent', () => {
    it('throws when the job does not exist', async () => {
      const service = buildService();

      await expect(service.recordEvent(999, { itemsProcessed: 1 })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('updates only the provided fields', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(
        testDb.db,
        { userId: user.id },
        { status: 'processing', itemsTotal: 100, itemsProcessed: 10 },
      );
      const service = buildService();

      await service.recordEvent(job.id, { itemsProcessed: 20 });

      const [row] = await testDb.db.select().from(importJob).where(eq(importJob.id, job.id));
      expect(row.itemsProcessed).toBe(20);
      expect(row.itemsTotal).toBe(100);
      expect(row.status).toBe('processing');
    });

    it('emits PROGRESS when the status is not set', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(
        testDb.db,
        { userId: user.id },
        { status: 'processing' },
      );
      const gateway = fakeGateway();
      const service = buildService({ gateway });

      await service.recordEvent(job.id, { itemsProcessed: 5 });

      expect(gateway.emitToUser).toHaveBeenCalledWith(
        user.id,
        ImportServerEvents.PROGRESS,
        expect.objectContaining({ itemsProcessed: 5 }),
      );
    });

    it('emits STAGED when the status becomes awaiting_review', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(
        testDb.db,
        { userId: user.id },
        { status: 'processing' },
      );
      const gateway = fakeGateway();
      const service = buildService({ gateway });

      await service.recordEvent(job.id, { status: 'awaiting_review' });

      expect(gateway.emitToUser).toHaveBeenCalledWith(
        user.id,
        ImportServerEvents.STAGED,
        expect.objectContaining({ status: 'awaiting_review' }),
      );
    });

    it('emits FAILED when the status becomes failed, and records the error', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(
        testDb.db,
        { userId: user.id },
        { status: 'processing' },
      );
      const gateway = fakeGateway();
      const service = buildService({ gateway });

      await service.recordEvent(job.id, {
        status: 'failed',
        error: 'Could not parse the export file',
      });

      const [row] = await testDb.db.select().from(importJob).where(eq(importJob.id, job.id));
      expect(row.status).toBe('failed');
      expect(row.error).toBe('Could not parse the export file');
      expect(gateway.emitToUser).toHaveBeenCalledWith(
        user.id,
        ImportServerEvents.FAILED,
        expect.objectContaining({ status: 'failed' }),
      );
    });
  });

  /* -------------------------------------------------------------------------- */
  /* cleanupOldImportJobs (cron)                                                */
  /* -------------------------------------------------------------------------- */
  describe('cleanupOldImportJobs', () => {
    async function backdate(jobId: number, daysAgo: number) {
      const past = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
      await testDb.db.update(importJob).set({ updatedAt: past }).where(eq(importJob.id, jobId));
    }

    it('does nothing when there is nothing to clean up', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(
        testDb.db,
        { userId: user.id },
        { status: 'awaiting_review' },
      );
      const service = buildService();

      await service.cleanupOldImportJobs();

      const rows = await testDb.db.select().from(importJob).where(eq(importJob.id, job.id));
      expect(rows).toHaveLength(1);
    });

    it('deletes completed jobs older than 7 days, keeps recent ones', async () => {
      const { user } = await createTestUser(testDb.db);
      const old = await createTestImportJob(
        testDb.db,
        { userId: user.id },
        { status: 'completed' },
      );
      const recent = await createTestImportJob(
        testDb.db,
        { userId: user.id },
        { status: 'completed' },
      );
      await backdate(old.id, 8);
      const service = buildService();

      await service.cleanupOldImportJobs();

      const remaining = await testDb.db
        .select()
        .from(importJob)
        .where(eq(importJob.userId, user.id));
      expect(remaining.map((r) => r.id)).toEqual([recent.id]);
    });

    it('deletes awaiting_review jobs older than 30 days, keeps recent ones', async () => {
      const { user } = await createTestUser(testDb.db);
      const old = await createTestImportJob(
        testDb.db,
        { userId: user.id },
        { status: 'awaiting_review' },
      );
      const recent = await createTestImportJob(
        testDb.db,
        { userId: user.id },
        { status: 'awaiting_review' },
      );
      await backdate(old.id, 31);
      const service = buildService();

      await service.cleanupOldImportJobs();

      const remaining = await testDb.db
        .select()
        .from(importJob)
        .where(eq(importJob.userId, user.id));
      expect(remaining.map((r) => r.id)).toEqual([recent.id]);
    });

    it('deletes failed jobs older than 14 days, keeps recent ones', async () => {
      const { user } = await createTestUser(testDb.db);
      const old = await createTestImportJob(testDb.db, { userId: user.id }, { status: 'failed' });
      const recent = await createTestImportJob(
        testDb.db,
        { userId: user.id },
        { status: 'failed' },
      );
      await backdate(old.id, 15);
      const service = buildService();

      await service.cleanupOldImportJobs();

      const remaining = await testDb.db
        .select()
        .from(importJob)
        .where(eq(importJob.userId, user.id));
      expect(remaining.map((r) => r.id)).toEqual([recent.id]);
    });

    it('never deletes pending or processing jobs regardless of age', async () => {
      const { user } = await createTestUser(testDb.db);
      const pending = await createTestImportJob(
        testDb.db,
        { userId: user.id },
        { status: 'pending' },
      );
      const processing = await createTestImportJob(
        testDb.db,
        { userId: user.id },
        { status: 'processing' },
      );
      await backdate(pending.id, 365);
      await backdate(processing.id, 365);
      const service = buildService();

      await service.cleanupOldImportJobs();

      const remaining = await testDb.db
        .select()
        .from(importJob)
        .where(eq(importJob.userId, user.id));
      expect(remaining.map((r) => r.id).sort()).toEqual([pending.id, processing.id].sort());
    });

    it('deletes the uploaded file of a cleaned up job', async () => {
      const { user } = await createTestUser(testDb.db);
      const old = await createTestImportJob(
        testDb.db,
        { userId: user.id },
        { status: 'completed', fileKey: 'old/key.zip' },
      );
      await backdate(old.id, 8);
      const transfersStorage = fakeTransfersStorage();
      const service = buildService({ transfersStorage });

      await service.cleanupOldImportJobs();

      await waitForCall(transfersStorage.deleteFile);
      expect(transfersStorage.deleteFile).toHaveBeenCalledWith('old/key.zip');
    });
  });
});
