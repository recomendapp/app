import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { follow, reco } from '@libs/db/schemas';
import {
  createFakeNotifyClient,
  createTestLogMovie,
  createTestMovie,
  createTestTvSeries,
  createTestUser,
  TestDatabase,
} from '@libs/testing';
import { User } from '../auth/auth.service';
import { RecoServerEvents } from '@libs/realtime';
import type { RealtimeGateway } from '../realtime/realtime.gateway';
import type { NotifyClient } from '@shared/notify';
import { RecoType } from './dto/recos.dto';

jest.mock('../realtime/realtime.gateway', () => ({ RealtimeGateway: jest.fn() }));

const { RecosService } = require('./recos.service') as typeof import('./recos.service');
const { UserRecosService } =
  require('../users/recos/user-recos.service') as typeof import('../users/recos/user-recos.service');

describe('RecosService', () => {
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

  function buildService(opts?: {
    notify?: jest.Mocked<NotifyClient>;
    gateway?: jest.Mocked<RealtimeGateway>;
  }) {
    const userRecosService = new UserRecosService(testDb.db);
    return new RecosService(
      testDb.db,
      opts?.notify ?? createFakeNotifyClient(),
      opts?.gateway ?? fakeGateway(),
      userRecosService,
    );
  }

  async function mutualFollow(userAId: string, userBId: string) {
    await testDb.db
      .insert(follow)
      .values({ followerId: userAId, followingId: userBId, status: 'accepted' });
    await testDb.db
      .insert(follow)
      .values({ followerId: userBId, followingId: userAId, status: 'accepted' });
  }

  async function waitForCall(mockFn: { mock: { calls: unknown[] } }, timeoutMs = 2000) {
    const start = Date.now();
    while (mockFn.mock.calls.length === 0) {
      if (Date.now() - start > timeoutMs)
        throw new Error('Timed out waiting for mock to be called');
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }

  describe('send', () => {
    it('throws when there are no valid receivers', async () => {
      const { user: sender } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const service = buildService();

      await expect(
        service.send({
          user: asUser(sender),
          type: RecoType.MOVIE,
          mediaId: movie.id,
          dto: { userIds: [] },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when the target is followed but does not follow back', async () => {
      const { user: sender } = await createTestUser(testDb.db);
      const { user: target } = await createTestUser(testDb.db);
      await testDb.db
        .insert(follow)
        .values({ followerId: sender.id, followingId: target.id, status: 'accepted' });
      const movie = await createTestMovie(testDb.db);
      const service = buildService();

      await expect(
        service.send({
          user: asUser(sender),
          type: RecoType.MOVIE,
          mediaId: movie.id,
          dto: { userIds: [target.id] },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when the target has already seen the movie', async () => {
      const { user: sender } = await createTestUser(testDb.db);
      const { user: target } = await createTestUser(testDb.db);
      await mutualFollow(sender.id, target.id);
      const movie = await createTestMovie(testDb.db);
      await createTestLogMovie(testDb.db, { userId: target.id, movieId: movie.id });
      const service = buildService();

      await expect(
        service.send({
          user: asUser(sender),
          type: RecoType.MOVIE,
          mediaId: movie.id,
          dto: { userIds: [target.id] },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('sends a movie reco to a mutual follower who has not seen it', async () => {
      const { user: sender } = await createTestUser(testDb.db);
      const { user: target } = await createTestUser(testDb.db);
      await mutualFollow(sender.id, target.id);
      const movie = await createTestMovie(testDb.db);
      const service = buildService();

      const result = await service.send({
        user: asUser(sender),
        type: RecoType.MOVIE,
        mediaId: movie.id,
        dto: { userIds: [target.id], comment: 'You will love it' },
      });

      expect(result.sent).toEqual([target.id]);
      expect(result.requested).toBe(1);
      expect(result.comment).toBe('You will love it');

      const [row] = await testDb.db
        .select()
        .from(reco)
        .where(and(eq(reco.userId, target.id), eq(reco.senderId, sender.id)));
      expect(row.movieId).toBe(movie.id);
      expect(row.status).toBe('active');
    });

    it('sends a tv series reco', async () => {
      const { user: sender } = await createTestUser(testDb.db);
      const { user: target } = await createTestUser(testDb.db);
      await mutualFollow(sender.id, target.id);
      const tvSeries = await createTestTvSeries(testDb.db);
      const service = buildService();

      const result = await service.send({
        user: asUser(sender),
        type: RecoType.TV_SERIES,
        mediaId: tvSeries.id,
        dto: { userIds: [target.id] },
      });

      expect(result.sent).toEqual([target.id]);
      expect(result.type).toBe('tv_series');
    });

    it('sends to multiple valid receivers and excludes invalid ones silently', async () => {
      const { user: sender } = await createTestUser(testDb.db);
      const { user: validTarget } = await createTestUser(testDb.db);
      const { user: oneWayTarget } = await createTestUser(testDb.db);
      await mutualFollow(sender.id, validTarget.id);
      await testDb.db
        .insert(follow)
        .values({ followerId: sender.id, followingId: oneWayTarget.id, status: 'accepted' });
      const movie = await createTestMovie(testDb.db);
      const service = buildService();

      const result = await service.send({
        user: asUser(sender),
        type: RecoType.MOVIE,
        mediaId: movie.id,
        dto: { userIds: [validTarget.id, oneWayTarget.id] },
      });

      expect(result.sent).toEqual([validTarget.id]);
      expect(result.requested).toBe(2);
    });

    it('is idempotent: an active duplicate reco to the same target is skipped', async () => {
      const { user: sender } = await createTestUser(testDb.db);
      const { user: target } = await createTestUser(testDb.db);
      await mutualFollow(sender.id, target.id);
      const movie = await createTestMovie(testDb.db);
      const service = buildService();

      await service.send({
        user: asUser(sender),
        type: RecoType.MOVIE,
        mediaId: movie.id,
        dto: { userIds: [target.id] },
      });
      const second = await service.send({
        user: asUser(sender),
        type: RecoType.MOVIE,
        mediaId: movie.id,
        dto: { userIds: [target.id] },
      });

      expect(second.sent).toEqual([]);
      const rows = await testDb.db
        .select()
        .from(reco)
        .where(and(eq(reco.userId, target.id), eq(reco.senderId, sender.id)));
      expect(rows).toHaveLength(1);
    });

    it('notifies and emits a SENT + RECEIVED realtime event', async () => {
      const { user: sender } = await createTestUser(testDb.db);
      const { user: target } = await createTestUser(testDb.db);
      await mutualFollow(sender.id, target.id);
      const movie = await createTestMovie(testDb.db);
      const notify = createFakeNotifyClient();
      const gateway = fakeGateway();
      const service = buildService({ notify, gateway });

      await service.send({
        user: asUser(sender),
        type: RecoType.MOVIE,
        mediaId: movie.id,
        dto: { userIds: [target.id] },
      });

      expect(notify.emit).toHaveBeenCalledWith(
        'reco:received',
        expect.objectContaining({
          senderId: sender.id,
          receiverIds: [target.id],
          mediaId: movie.id,
          type: 'movie',
        }),
      );
      expect(gateway.emitToUser).toHaveBeenCalledWith(
        sender.id,
        RecoServerEvents.SENT,
        expect.anything(),
      );
      await waitForCall(gateway.emitToUser, 2000);
    });
  });

  describe('deleteByMedia', () => {
    // `deleteByMedia` scopes to `reco.userId`, the receiver — this is the receiver dismissing a
    // reco they got for that media, not the sender revoking one they sent.
    it('soft-deletes the receiver own active reco for that media', async () => {
      const { user: sender } = await createTestUser(testDb.db);
      const { user: target } = await createTestUser(testDb.db);
      await mutualFollow(sender.id, target.id);
      const movie = await createTestMovie(testDb.db);
      const service = buildService();
      await service.send({
        user: asUser(sender),
        type: RecoType.MOVIE,
        mediaId: movie.id,
        dto: { userIds: [target.id] },
      });

      const result = await service.deleteByMedia({
        user: asUser(target),
        type: RecoType.MOVIE,
        mediaId: movie.id,
      });

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('deleted');
    });

    it('does not delete another user recos', async () => {
      const { user: sender } = await createTestUser(testDb.db);
      const { user: target } = await createTestUser(testDb.db);
      await mutualFollow(sender.id, target.id);
      const movie = await createTestMovie(testDb.db);
      const service = buildService();
      await service.send({
        user: asUser(sender),
        type: RecoType.MOVIE,
        mediaId: movie.id,
        dto: { userIds: [target.id] },
      });

      // The sender isn't the reco's `userId` (they're `senderId`), so this finds nothing.
      const result = await service.deleteByMedia({
        user: asUser(sender),
        type: RecoType.MOVIE,
        mediaId: movie.id,
      });

      expect(result).toEqual([]);
    });
  });

  describe('deleteById', () => {
    it('throws when the reco does not exist', async () => {
      const { user } = await createTestUser(testDb.db);
      const service = buildService();

      await expect(service.deleteById({ id: 999, user: asUser(user) })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws when the user is neither sender nor receiver', async () => {
      const { user: sender } = await createTestUser(testDb.db);
      const { user: target } = await createTestUser(testDb.db);
      const { user: stranger } = await createTestUser(testDb.db);
      await mutualFollow(sender.id, target.id);
      const movie = await createTestMovie(testDb.db);
      const service = buildService();
      const sent = await service.send({
        user: asUser(sender),
        type: RecoType.MOVIE,
        mediaId: movie.id,
        dto: { userIds: [target.id] },
      });
      const [row] = await testDb.db.select().from(reco).where(eq(reco.userId, target.id));

      await expect(service.deleteById({ id: row.id, user: asUser(stranger) })).rejects.toThrow(
        ForbiddenException,
      );
      expect(sent.sent).toEqual([target.id]);
    });

    it('hard-deletes the row when the sender deletes it', async () => {
      const { user: sender } = await createTestUser(testDb.db);
      const { user: target } = await createTestUser(testDb.db);
      await mutualFollow(sender.id, target.id);
      const movie = await createTestMovie(testDb.db);
      const service = buildService();
      await service.send({
        user: asUser(sender),
        type: RecoType.MOVIE,
        mediaId: movie.id,
        dto: { userIds: [target.id] },
      });
      const [row] = await testDb.db.select().from(reco).where(eq(reco.userId, target.id));

      await service.deleteById({ id: row.id, user: asUser(sender) });

      const rows = await testDb.db.select().from(reco).where(eq(reco.id, row.id));
      expect(rows).toHaveLength(0);
    });

    it('soft-deletes the row when the receiver deletes it', async () => {
      const { user: sender } = await createTestUser(testDb.db);
      const { user: target } = await createTestUser(testDb.db);
      await mutualFollow(sender.id, target.id);
      const movie = await createTestMovie(testDb.db);
      const service = buildService();
      await service.send({
        user: asUser(sender),
        type: RecoType.MOVIE,
        mediaId: movie.id,
        dto: { userIds: [target.id] },
      });
      const [row] = await testDb.db.select().from(reco).where(eq(reco.userId, target.id));

      const result = await service.deleteById({ id: row.id, user: asUser(target) });

      expect(result.status).toBe('deleted');
      const [dbRow] = await testDb.db.select().from(reco).where(eq(reco.id, row.id));
      expect(dbRow.status).toBe('deleted');
    });
  });

  describe('complete', () => {
    it('marks the user active recos for that media as completed and notifies senders', async () => {
      const { user: sender } = await createTestUser(testDb.db);
      const { user: target } = await createTestUser(testDb.db);
      await mutualFollow(sender.id, target.id);
      const movie = await createTestMovie(testDb.db);
      const notify = createFakeNotifyClient();
      const service = buildService({ notify });
      await service.send({
        user: asUser(sender),
        type: RecoType.MOVIE,
        mediaId: movie.id,
        dto: { userIds: [target.id] },
      });

      const result = await service.complete({
        userId: target.id,
        type: RecoType.MOVIE,
        mediaId: movie.id,
      });

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('completed');
      expect(notify.emit).toHaveBeenCalledWith(
        'reco:completed',
        expect.objectContaining({
          userId: target.id,
          senderIds: [sender.id],
          mediaId: movie.id,
          type: 'movie',
        }),
      );
    });

    it('does nothing and does not notify when there is no active reco for that media', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const notify = createFakeNotifyClient();
      const service = buildService({ notify });

      const result = await service.complete({
        userId: user.id,
        type: RecoType.MOVIE,
        mediaId: movie.id,
      });

      expect(result).toEqual([]);
      expect(notify.emit).not.toHaveBeenCalled();
    });
  });
});
