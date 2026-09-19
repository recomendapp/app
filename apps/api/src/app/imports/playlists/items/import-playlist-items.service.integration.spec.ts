import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  createTestImportJob,
  createTestImportJobPlaylist,
  createTestImportJobPlaylistItem,
  createTestMovie,
  createTestTvSeries,
  createTestUser,
  TestDatabase,
} from '@libs/testing';
import { defaultSupportedLocale } from '@libs/i18n';
import { User } from '../../../auth/auth.service';
import { ImportServerEvents } from '@libs/realtime';
import type { RealtimeGateway } from '../../../realtime/realtime.gateway';

jest.mock('../../../realtime/realtime.gateway', () => ({ RealtimeGateway: jest.fn() }));

const { ImportPlaylistItemsService } =
  require('./import-playlist-items.service') as typeof import('./import-playlist-items.service');

describe('ImportPlaylistItemsService', () => {
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
      const service = new ImportPlaylistItemsService(testDb.db, fakeGateway());

      await expect(service.listAll(asUser(user), 999, 1, defaultSupportedLocale)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws when the playlist does not exist in that job', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: user.id });
      const service = new ImportPlaylistItemsService(testDb.db, fakeGateway());

      await expect(
        service.listAll(asUser(user), job.id, 999, defaultSupportedLocale),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws when the playlist belongs to a different job', async () => {
      const { user } = await createTestUser(testDb.db);
      const jobA = await createTestImportJob(testDb.db, { userId: user.id });
      const jobB = await createTestImportJob(testDb.db, { userId: user.id });
      const playlistInJobB = await createTestImportJobPlaylist(testDb.db, { importJobId: jobB.id });
      const service = new ImportPlaylistItemsService(testDb.db, fakeGateway());

      await expect(
        service.listAll(asUser(user), jobA.id, playlistInJobB.id, defaultSupportedLocale),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns an empty array for a playlist with no staged items', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: user.id });
      const playlist = await createTestImportJobPlaylist(testDb.db, { importJobId: job.id });
      const service = new ImportPlaylistItemsService(testDb.db, fakeGateway());

      await expect(
        service.listAll(asUser(user), job.id, playlist.id, defaultSupportedLocale),
      ).resolves.toEqual([]);
    });

    it('lists staged items ordered by sourceOrder, with media attached', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: user.id });
      const playlist = await createTestImportJobPlaylist(testDb.db, { importJobId: job.id });
      const movie = await createTestMovie(testDb.db);
      const tvSeries = await createTestTvSeries(testDb.db);
      const second = await createTestImportJobPlaylistItem(testDb.db, {
        importJobPlaylistId: playlist.id,
        movieId: movie.id,
        sourceOrder: 2,
      });
      const first = await createTestImportJobPlaylistItem(testDb.db, {
        importJobPlaylistId: playlist.id,
        tvSeriesId: tvSeries.id,
        sourceOrder: 1,
      });
      const service = new ImportPlaylistItemsService(testDb.db, fakeGateway());

      const result = await service.listAll(
        asUser(user),
        job.id,
        playlist.id,
        defaultSupportedLocale,
      );

      expect(result.map((r) => r.id)).toEqual([first.id, second.id]);
      expect(result[0].tvSeries?.id).toBe(tvSeries.id);
      expect(result[1].movie?.id).toBe(movie.id);
    });

    it('does not leak items from another playlist', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: user.id });
      const playlistA = await createTestImportJobPlaylist(testDb.db, { importJobId: job.id });
      const playlistB = await createTestImportJobPlaylist(testDb.db, { importJobId: job.id });
      await createTestImportJobPlaylistItem(testDb.db, { importJobPlaylistId: playlistB.id });
      const service = new ImportPlaylistItemsService(testDb.db, fakeGateway());

      await expect(
        service.listAll(asUser(user), job.id, playlistA.id, defaultSupportedLocale),
      ).resolves.toEqual([]);
    });
  });

  describe('listPaginated', () => {
    it('paginates results and reports accurate meta', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: user.id });
      const playlist = await createTestImportJobPlaylist(testDb.db, { importJobId: job.id });
      const items = [];
      for (let i = 0; i < 3; i++) {
        items.push(
          await createTestImportJobPlaylistItem(testDb.db, {
            importJobPlaylistId: playlist.id,
            sourceOrder: i,
          }),
        );
      }
      const service = new ImportPlaylistItemsService(testDb.db, fakeGateway());

      const page1 = await service.listPaginated(
        asUser(user),
        job.id,
        playlist.id,
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
        playlist.id,
        { page: 2, per_page: 2 },
        defaultSupportedLocale,
      );
      expect(page2.data.map((r) => r.id)).toEqual([items[2].id]);
    });
  });

  describe('listInfinite', () => {
    it('paginates by (sourceOrder, id) with a cursor until there is no next page', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: user.id });
      const playlist = await createTestImportJobPlaylist(testDb.db, { importJobId: job.id });
      const items = [];
      for (let i = 0; i < 3; i++) {
        items.push(
          await createTestImportJobPlaylistItem(testDb.db, {
            importJobPlaylistId: playlist.id,
            sourceOrder: i,
          }),
        );
      }
      const service = new ImportPlaylistItemsService(testDb.db, fakeGateway());

      const firstPage = await service.listInfinite(
        asUser(user),
        job.id,
        playlist.id,
        { per_page: 2 },
        defaultSupportedLocale,
      );
      expect(firstPage.data.map((r) => r.id)).toEqual([items[0].id, items[1].id]);
      expect(firstPage.meta.next_cursor).not.toBeNull();

      const secondPage = await service.listInfinite(
        asUser(user),
        job.id,
        playlist.id,
        { per_page: 2, cursor: firstPage.meta.next_cursor ?? undefined },
        defaultSupportedLocale,
      );
      expect(secondPage.data.map((r) => r.id)).toEqual([items[2].id]);
      expect(secondPage.meta.next_cursor).toBeNull();
    });

    it('breaks ties on id when several items share the same sourceOrder', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: user.id });
      const playlist = await createTestImportJobPlaylist(testDb.db, { importJobId: job.id });
      const first = await createTestImportJobPlaylistItem(testDb.db, {
        importJobPlaylistId: playlist.id,
        sourceOrder: 0,
      });
      const second = await createTestImportJobPlaylistItem(testDb.db, {
        importJobPlaylistId: playlist.id,
        sourceOrder: 0,
      });
      const service = new ImportPlaylistItemsService(testDb.db, fakeGateway());

      const firstPage = await service.listInfinite(
        asUser(user),
        job.id,
        playlist.id,
        { per_page: 1 },
        defaultSupportedLocale,
      );
      expect(firstPage.data.map((r) => r.id)).toEqual([first.id]);

      const secondPage = await service.listInfinite(
        asUser(user),
        job.id,
        playlist.id,
        { per_page: 1, cursor: firstPage.meta.next_cursor ?? undefined },
        defaultSupportedLocale,
      );
      expect(secondPage.data.map((r) => r.id)).toEqual([second.id]);
      expect(secondPage.meta.next_cursor).toBeNull();
    });

    it('rejects a cursor that is not valid base64-encoded JSON', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: user.id });
      const playlist = await createTestImportJobPlaylist(testDb.db, { importJobId: job.id });
      const service = new ImportPlaylistItemsService(testDb.db, fakeGateway());

      await expect(
        service.listInfinite(
          asUser(user),
          job.id,
          playlist.id,
          { per_page: 10, cursor: 'not-a-valid-cursor' },
          defaultSupportedLocale,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a cursor that decodes to the wrong shape', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: user.id });
      const playlist = await createTestImportJobPlaylist(testDb.db, { importJobId: job.id });
      const wrongShapeCursor = Buffer.from(JSON.stringify({ foo: 'bar' })).toString('base64');
      const service = new ImportPlaylistItemsService(testDb.db, fakeGateway());

      await expect(
        service.listInfinite(
          asUser(user),
          job.id,
          playlist.id,
          { per_page: 10, cursor: wrongShapeCursor },
          defaultSupportedLocale,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('patch', () => {
    it('throws when the job is not found or not owned', async () => {
      const { user } = await createTestUser(testDb.db);
      const service = new ImportPlaylistItemsService(testDb.db, fakeGateway());

      await expect(
        service.patch(asUser(user), 999, 1, 1, { matchStatus: 'skipped' }, defaultSupportedLocale),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws when the job is not awaiting_review', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(
        testDb.db,
        { userId: user.id },
        { status: 'completed' },
      );
      const playlist = await createTestImportJobPlaylist(testDb.db, { importJobId: job.id });
      const item = await createTestImportJobPlaylistItem(testDb.db, {
        importJobPlaylistId: playlist.id,
      });
      const service = new ImportPlaylistItemsService(testDb.db, fakeGateway());

      await expect(
        service.patch(
          asUser(user),
          job.id,
          playlist.id,
          item.id,
          { matchStatus: 'skipped' },
          defaultSupportedLocale,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when the playlist does not exist in that job', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: user.id });
      const service = new ImportPlaylistItemsService(testDb.db, fakeGateway());

      await expect(
        service.patch(
          asUser(user),
          job.id,
          999,
          1,
          { matchStatus: 'skipped' },
          defaultSupportedLocale,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws when the item does not exist in that playlist', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: user.id });
      const playlist = await createTestImportJobPlaylist(testDb.db, { importJobId: job.id });
      const service = new ImportPlaylistItemsService(testDb.db, fakeGateway());

      await expect(
        service.patch(
          asUser(user),
          job.id,
          playlist.id,
          999,
          { matchStatus: 'skipped' },
          defaultSupportedLocale,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('sets movieId, marks matched, and clears tvSeriesId', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: user.id });
      const playlist = await createTestImportJobPlaylist(testDb.db, { importJobId: job.id });
      const tvSeries = await createTestTvSeries(testDb.db);
      const item = await createTestImportJobPlaylistItem(testDb.db, {
        importJobPlaylistId: playlist.id,
        tvSeriesId: tvSeries.id,
      });
      const movie = await createTestMovie(testDb.db);
      const service = new ImportPlaylistItemsService(testDb.db, fakeGateway());

      const result = await service.patch(
        asUser(user),
        job.id,
        playlist.id,
        item.id,
        { movieId: movie.id },
        defaultSupportedLocale,
      );

      expect(result.movieId).toBe(movie.id);
      expect(result.tvSeriesId).toBeNull();
      expect(result.type).toBe('movie');
      expect(result.matchStatus).toBe('matched');
      expect(result.movie?.id).toBe(movie.id);
    });

    it('sets matchStatus to skipped', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: user.id });
      const playlist = await createTestImportJobPlaylist(testDb.db, { importJobId: job.id });
      const item = await createTestImportJobPlaylistItem(testDb.db, {
        importJobPlaylistId: playlist.id,
      });
      const service = new ImportPlaylistItemsService(testDb.db, fakeGateway());

      const result = await service.patch(
        asUser(user),
        job.id,
        playlist.id,
        item.id,
        { matchStatus: 'skipped' },
        defaultSupportedLocale,
      );

      expect(result.matchStatus).toBe('skipped');
    });

    it('emits a PLAYLIST_ITEM_PATCHED realtime event', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: user.id });
      const playlist = await createTestImportJobPlaylist(testDb.db, { importJobId: job.id });
      const item = await createTestImportJobPlaylistItem(testDb.db, {
        importJobPlaylistId: playlist.id,
      });
      const gateway = fakeGateway();
      const service = new ImportPlaylistItemsService(testDb.db, gateway);

      const result = await service.patch(
        asUser(user),
        job.id,
        playlist.id,
        item.id,
        { matchStatus: 'skipped' },
        defaultSupportedLocale,
      );

      expect(gateway.emitToUser).toHaveBeenCalledWith(
        user.id,
        ImportServerEvents.PLAYLIST_ITEM_PATCHED,
        { importJobId: job.id, playlistId: playlist.id, item: result },
      );
    });
  });
});
