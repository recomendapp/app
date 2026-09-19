import { BadRequestException, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { profile } from '@libs/db/schemas';
import { createFakeNotifyClient, createTestUser, TestDatabase } from '@libs/testing';
import type { RealtimeGateway } from '../../realtime/realtime.gateway';
import { UserFollowServerEvents } from '@libs/realtime';

jest.mock('../../realtime/realtime.gateway', () => ({ RealtimeGateway: jest.fn() }));

const { UserFollowService } =
  require('./user-follow.service') as typeof import('./user-follow.service');

describe('UserFollowService', () => {
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

  const fakeGateway = () =>
    ({ emitToUser: jest.fn(), emitToUsers: jest.fn() }) as unknown as jest.Mocked<RealtimeGateway>;

  function buildService(gateway?: jest.Mocked<RealtimeGateway>) {
    return new UserFollowService(testDb.db, createFakeNotifyClient(), gateway ?? fakeGateway());
  }

  async function getProfileCounts(userId: string) {
    const p = await testDb.db.query.profile.findFirst({ where: eq(profile.id, userId) });
    return { followers: p?.followersCount, following: p?.followingCount };
  }

  describe('get', () => {
    it('throws when targeting yourself', async () => {
      const { user } = await createTestUser(testDb.db);

      await expect(
        buildService().get({ currentUserId: user.id, targetUserId: user.id }),
      ).rejects.toThrow(BadRequestException);
    });

    it('returns null when there is no follow relationship', async () => {
      const { user: a } = await createTestUser(testDb.db);
      const { user: b } = await createTestUser(testDb.db);

      const result = await buildService().get({ currentUserId: a.id, targetUserId: b.id });

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('throws when targeting yourself', async () => {
      const { user } = await createTestUser(testDb.db);

      await expect(
        buildService().set({ currentUserId: user.id, targetUserId: user.id }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when the target user does not exist', async () => {
      const { user } = await createTestUser(testDb.db);

      await expect(
        buildService().set({
          currentUserId: user.id,
          targetUserId: '00000000-0000-0000-0000-000000000000',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('auto-accepts and increments both counters for a public account', async () => {
      const { user: follower } = await createTestUser(testDb.db);
      const { user: target } = await createTestUser(testDb.db);

      const result = await buildService().set({
        currentUserId: follower.id,
        targetUserId: target.id,
      });

      expect(result.status).toBe('accepted');
      expect(await getProfileCounts(follower.id)).toMatchObject({ following: 1 });
      expect(await getProfileCounts(target.id)).toMatchObject({ followers: 1 });
    });

    it('leaves both counters untouched (pending) for a private account until accepted', async () => {
      const { user: follower } = await createTestUser(testDb.db);
      const { user: target } = await createTestUser(testDb.db, { profile: { isPrivate: true } });

      const result = await buildService().set({
        currentUserId: follower.id,
        targetUserId: target.id,
      });

      expect(result.status).toBe('pending');
      expect(await getProfileCounts(follower.id)).toMatchObject({ following: 0 });
      expect(await getProfileCounts(target.id)).toMatchObject({ followers: 0 });
    });

    it('is idempotent: following twice does not double count', async () => {
      const { user: follower } = await createTestUser(testDb.db);
      const { user: target } = await createTestUser(testDb.db);
      await buildService().set({ currentUserId: follower.id, targetUserId: target.id });

      const second = await buildService().set({
        currentUserId: follower.id,
        targetUserId: target.id,
      });

      expect(second.status).toBe('accepted');
      expect(await getProfileCounts(follower.id)).toMatchObject({ following: 1 });
      expect(await getProfileCounts(target.id)).toMatchObject({ followers: 1 });
    });

    it('emits follow:new for an auto-accepted (public) follow', async () => {
      const { user: follower } = await createTestUser(testDb.db);
      const { user: target } = await createTestUser(testDb.db);
      const notify = createFakeNotifyClient();
      const service = new UserFollowService(testDb.db, notify, fakeGateway());

      await service.set({ currentUserId: follower.id, targetUserId: target.id });

      expect(notify.emit).toHaveBeenCalledWith(
        'follow:new',
        expect.objectContaining({ actorId: follower.id, targetUserId: target.id }),
      );
    });

    it('emits follow:request for a pending (private) follow', async () => {
      const { user: follower } = await createTestUser(testDb.db);
      const { user: target } = await createTestUser(testDb.db, { profile: { isPrivate: true } });
      const notify = createFakeNotifyClient();
      const service = new UserFollowService(testDb.db, notify, fakeGateway());

      await service.set({ currentUserId: follower.id, targetUserId: target.id });

      expect(notify.emit).toHaveBeenCalledWith(
        'follow:request',
        expect.objectContaining({ actorId: follower.id, targetUserId: target.id }),
      );
    });

    it('broadcasts UserFollowServerEvents.SET to both parties', async () => {
      const { user: follower } = await createTestUser(testDb.db);
      const { user: target } = await createTestUser(testDb.db);
      const gateway = fakeGateway();

      await buildService(gateway).set({ currentUserId: follower.id, targetUserId: target.id });

      expect(gateway.emitToUsers).toHaveBeenCalledWith(
        [follower.id, target.id],
        UserFollowServerEvents.SET,
        expect.anything(),
      );
    });
  });

  describe('delete', () => {
    it('throws when targeting yourself', async () => {
      const { user } = await createTestUser(testDb.db);

      await expect(
        buildService().delete({ currentUserId: user.id, targetUserId: user.id }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when there is no follow relationship', async () => {
      const { user: a } = await createTestUser(testDb.db);
      const { user: b } = await createTestUser(testDb.db);

      await expect(
        buildService().delete({ currentUserId: a.id, targetUserId: b.id }),
      ).rejects.toThrow(NotFoundException);
    });

    it('decrements both counters when unfollowing an accepted follow', async () => {
      const { user: follower } = await createTestUser(testDb.db);
      const { user: target } = await createTestUser(testDb.db);
      await buildService().set({ currentUserId: follower.id, targetUserId: target.id });

      await buildService().delete({ currentUserId: follower.id, targetUserId: target.id });

      expect(await getProfileCounts(follower.id)).toMatchObject({ following: 0 });
      expect(await getProfileCounts(target.id)).toMatchObject({ followers: 0 });
    });

    it('does not touch counters when cancelling a still-pending (private) follow request', async () => {
      const { user: follower } = await createTestUser(testDb.db);
      const { user: target } = await createTestUser(testDb.db, { profile: { isPrivate: true } });
      await buildService().set({ currentUserId: follower.id, targetUserId: target.id });

      await buildService().delete({ currentUserId: follower.id, targetUserId: target.id });

      expect(await getProfileCounts(follower.id)).toMatchObject({ following: 0 });
      expect(await getProfileCounts(target.id)).toMatchObject({ followers: 0 });
    });

    it('broadcasts UserFollowServerEvents.DELETED to both parties', async () => {
      const { user: follower } = await createTestUser(testDb.db);
      const { user: target } = await createTestUser(testDb.db);
      await buildService().set({ currentUserId: follower.id, targetUserId: target.id });
      const gateway = fakeGateway();

      await buildService(gateway).delete({ currentUserId: follower.id, targetUserId: target.id });

      expect(gateway.emitToUsers).toHaveBeenCalledWith(
        [follower.id, target.id],
        UserFollowServerEvents.DELETED,
        expect.anything(),
      );
    });
  });

  describe('accept', () => {
    it('throws when targeting yourself', async () => {
      const { user } = await createTestUser(testDb.db);

      await expect(
        buildService().accept({ currentUserId: user.id, targetUserId: user.id }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when there is no pending request', async () => {
      const { user: a } = await createTestUser(testDb.db);
      const { user: b } = await createTestUser(testDb.db);

      await expect(
        buildService().accept({ currentUserId: a.id, targetUserId: b.id }),
      ).rejects.toThrow(NotFoundException);
    });

    it('increments both counters only once accepted', async () => {
      const { user: follower } = await createTestUser(testDb.db);
      const { user: target } = await createTestUser(testDb.db, { profile: { isPrivate: true } });
      await buildService().set({ currentUserId: follower.id, targetUserId: target.id });
      expect(await getProfileCounts(follower.id)).toMatchObject({ following: 0 });

      const result = await buildService().accept({
        currentUserId: target.id,
        targetUserId: follower.id,
      });

      expect(result.status).toBe('accepted');
      expect(await getProfileCounts(follower.id)).toMatchObject({ following: 1 });
      expect(await getProfileCounts(target.id)).toMatchObject({ followers: 1 });
    });

    it("cannot accept the other party's own outgoing follow (wrong direction)", async () => {
      const { user: follower } = await createTestUser(testDb.db);
      const { user: target } = await createTestUser(testDb.db, { profile: { isPrivate: true } });
      await buildService().set({ currentUserId: follower.id, targetUserId: target.id });

      // The follower tries to "accept" their own pending request instead of the target doing so.
      await expect(
        buildService().accept({ currentUserId: follower.id, targetUserId: target.id }),
      ).rejects.toThrow(NotFoundException);
    });

    it('broadcasts UserFollowServerEvents.ACCEPTED to both parties', async () => {
      const { user: follower } = await createTestUser(testDb.db);
      const { user: target } = await createTestUser(testDb.db, { profile: { isPrivate: true } });
      await buildService().set({ currentUserId: follower.id, targetUserId: target.id });
      const gateway = fakeGateway();

      await buildService(gateway).accept({ currentUserId: target.id, targetUserId: follower.id });

      expect(gateway.emitToUsers).toHaveBeenCalledWith(
        [target.id, follower.id],
        UserFollowServerEvents.ACCEPTED,
        expect.anything(),
      );
    });
  });

  describe('decline', () => {
    it('throws when targeting yourself', async () => {
      const { user } = await createTestUser(testDb.db);

      await expect(
        buildService().decline({ currentUserId: user.id, targetUserId: user.id }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when there is no pending request', async () => {
      const { user: a } = await createTestUser(testDb.db);
      const { user: b } = await createTestUser(testDb.db);

      await expect(
        buildService().decline({ currentUserId: a.id, targetUserId: b.id }),
      ).rejects.toThrow(NotFoundException);
    });

    it('removes the pending request without ever touching the counters', async () => {
      const { user: follower } = await createTestUser(testDb.db);
      const { user: target } = await createTestUser(testDb.db, { profile: { isPrivate: true } });
      await buildService().set({ currentUserId: follower.id, targetUserId: target.id });

      await buildService().decline({ currentUserId: target.id, targetUserId: follower.id });

      expect(await getProfileCounts(follower.id)).toMatchObject({ following: 0 });
      expect(await getProfileCounts(target.id)).toMatchObject({ followers: 0 });
      const stored = await buildService().get({
        currentUserId: follower.id,
        targetUserId: target.id,
      });
      expect(stored).toBeNull();
    });
  });
});
