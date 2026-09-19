import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  createTestImportJob,
  createTestImportJobPlaylist,
  createTestUser,
  TestDatabase,
} from '@libs/testing';
import { User } from '../../auth/auth.service';
import { ImportServerEvents } from '@libs/realtime';
import type { RealtimeGateway } from '../../realtime/realtime.gateway';

jest.mock('../../realtime/realtime.gateway', () => ({ RealtimeGateway: jest.fn() }));

const { ImportPlaylistsService } =
  require('./import-playlists.service') as typeof import('./import-playlists.service');

describe('ImportPlaylistsService', () => {
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
      const service = new ImportPlaylistsService(testDb.db, fakeGateway());

      await expect(service.listAll(asUser(user), 999)).rejects.toThrow(NotFoundException);
    });

    it('returns an empty array for a job with no staged playlists', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: user.id });
      const service = new ImportPlaylistsService(testDb.db, fakeGateway());

      await expect(service.listAll(asUser(user), job.id)).resolves.toEqual([]);
    });

    it('lists staged playlists ordered by id', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: user.id });
      const first = await createTestImportJobPlaylist(
        testDb.db,
        { importJobId: job.id },
        { title: 'Watchlist' },
      );
      const second = await createTestImportJobPlaylist(
        testDb.db,
        { importJobId: job.id },
        { title: 'Favorites' },
      );
      const service = new ImportPlaylistsService(testDb.db, fakeGateway());

      const result = await service.listAll(asUser(user), job.id);

      expect(result.map((r) => r.id)).toEqual([first.id, second.id]);
      expect(result.map((r) => r.title)).toEqual(['Watchlist', 'Favorites']);
    });

    it('defaults matchStatus to matched, not unmatched', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: user.id });
      await createTestImportJobPlaylist(testDb.db, { importJobId: job.id });
      const service = new ImportPlaylistsService(testDb.db, fakeGateway());

      const [result] = await service.listAll(asUser(user), job.id);

      expect(result.matchStatus).toBe('matched');
    });

    it('does not leak another job staged playlists', async () => {
      const { user } = await createTestUser(testDb.db);
      const jobA = await createTestImportJob(testDb.db, { userId: user.id });
      const jobB = await createTestImportJob(testDb.db, { userId: user.id });
      await createTestImportJobPlaylist(testDb.db, { importJobId: jobB.id });
      const service = new ImportPlaylistsService(testDb.db, fakeGateway());

      await expect(service.listAll(asUser(user), jobA.id)).resolves.toEqual([]);
    });
  });

  describe('listPaginated', () => {
    it('paginates results and reports accurate meta', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: user.id });
      const items = [];
      for (let i = 0; i < 3; i++) {
        items.push(await createTestImportJobPlaylist(testDb.db, { importJobId: job.id }));
      }
      const service = new ImportPlaylistsService(testDb.db, fakeGateway());

      const page1 = await service.listPaginated(asUser(user), job.id, { page: 1, per_page: 2 });
      expect(page1.data.map((r) => r.id)).toEqual([items[0].id, items[1].id]);
      expect(page1.meta).toEqual({
        total_results: 3,
        total_pages: 2,
        current_page: 1,
        per_page: 2,
      });

      const page2 = await service.listPaginated(asUser(user), job.id, { page: 2, per_page: 2 });
      expect(page2.data.map((r) => r.id)).toEqual([items[2].id]);
    });

    it('throws when the job is not found or not owned', async () => {
      const { user } = await createTestUser(testDb.db);
      const service = new ImportPlaylistsService(testDb.db, fakeGateway());

      await expect(
        service.listPaginated(asUser(user), 999, { page: 1, per_page: 10 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('listInfinite', () => {
    it('paginates with a cursor until there is no next page', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: user.id });
      const items = [];
      for (let i = 0; i < 3; i++) {
        items.push(await createTestImportJobPlaylist(testDb.db, { importJobId: job.id }));
      }
      const service = new ImportPlaylistsService(testDb.db, fakeGateway());

      const firstPage = await service.listInfinite(asUser(user), job.id, { per_page: 2 });
      expect(firstPage.data.map((r) => r.id)).toEqual([items[0].id, items[1].id]);
      expect(firstPage.meta.next_cursor).not.toBeNull();

      const secondPage = await service.listInfinite(asUser(user), job.id, {
        per_page: 2,
        cursor: firstPage.meta.next_cursor ?? undefined,
      });
      expect(secondPage.data.map((r) => r.id)).toEqual([items[2].id]);
      expect(secondPage.meta.next_cursor).toBeNull();
    });

    it('includes the total count only on the first page when requested', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: user.id });
      await createTestImportJobPlaylist(testDb.db, { importJobId: job.id });
      await createTestImportJobPlaylist(testDb.db, { importJobId: job.id });
      const service = new ImportPlaylistsService(testDb.db, fakeGateway());

      const firstPage = await service.listInfinite(asUser(user), job.id, {
        per_page: 1,
        include_total_count: true,
      });
      expect(firstPage.meta.total_results).toBe(2);

      const secondPage = await service.listInfinite(asUser(user), job.id, {
        per_page: 1,
        include_total_count: true,
        cursor: firstPage.meta.next_cursor ?? undefined,
      });
      expect(secondPage.meta.total_results).toBeUndefined();
    });

    it('rejects a cursor that is not valid base64-encoded JSON', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: user.id });
      const service = new ImportPlaylistsService(testDb.db, fakeGateway());

      await expect(
        service.listInfinite(asUser(user), job.id, { per_page: 10, cursor: 'not-a-valid-cursor' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a cursor that decodes to the wrong shape', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: user.id });
      const wrongShapeCursor = Buffer.from(JSON.stringify({ foo: 'bar' })).toString('base64');
      const service = new ImportPlaylistsService(testDb.db, fakeGateway());

      await expect(
        service.listInfinite(asUser(user), job.id, { per_page: 10, cursor: wrongShapeCursor }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when the job is not found or not owned', async () => {
      const { user } = await createTestUser(testDb.db);
      const service = new ImportPlaylistsService(testDb.db, fakeGateway());

      await expect(service.listInfinite(asUser(user), 999, { per_page: 10 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('patch', () => {
    it('throws when the job is not found or not owned', async () => {
      const { user } = await createTestUser(testDb.db);
      const service = new ImportPlaylistsService(testDb.db, fakeGateway());

      await expect(service.patch(asUser(user), 999, 1, { matchStatus: 'skipped' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws when the job is not awaiting_review', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(
        testDb.db,
        { userId: user.id },
        { status: 'completed' },
      );
      const item = await createTestImportJobPlaylist(testDb.db, { importJobId: job.id });
      const service = new ImportPlaylistsService(testDb.db, fakeGateway());

      await expect(
        service.patch(asUser(user), job.id, item.id, { matchStatus: 'skipped' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when the item does not exist in that job', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: user.id });
      const service = new ImportPlaylistsService(testDb.db, fakeGateway());

      await expect(
        service.patch(asUser(user), job.id, 999, { matchStatus: 'skipped' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('sets matchStatus to skipped and back to matched', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: user.id });
      const item = await createTestImportJobPlaylist(testDb.db, { importJobId: job.id });
      const service = new ImportPlaylistsService(testDb.db, fakeGateway());

      const skipped = await service.patch(asUser(user), job.id, item.id, {
        matchStatus: 'skipped',
      });
      expect(skipped.matchStatus).toBe('skipped');

      const restored = await service.patch(asUser(user), job.id, item.id, {
        matchStatus: 'matched',
      });
      expect(restored.matchStatus).toBe('matched');
    });

    it('emits a PLAYLIST_PATCHED realtime event', async () => {
      const { user } = await createTestUser(testDb.db);
      const job = await createTestImportJob(testDb.db, { userId: user.id });
      const item = await createTestImportJobPlaylist(testDb.db, { importJobId: job.id });
      const gateway = fakeGateway();
      const service = new ImportPlaylistsService(testDb.db, gateway);

      const result = await service.patch(asUser(user), job.id, item.id, { matchStatus: 'skipped' });

      expect(gateway.emitToUser).toHaveBeenCalledWith(
        user.id,
        ImportServerEvents.PLAYLIST_PATCHED,
        {
          importJobId: job.id,
          item: result,
        },
      );
    });
  });
});
