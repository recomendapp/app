import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { follow } from '@libs/db/schemas';
import { createTestUser, TestDatabase } from '@libs/testing';
import { User } from '../../auth/auth.service';
import { UserSortBy } from '../dto/users.dto';
import { SortOrder } from '../../../common/dto/sort.dto';
import { UserFollowersService } from './user-followers.service';

describe('UserFollowersService', () => {
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
  const service = () => new UserFollowersService(testDb.db);
  const baseQuery = { sort_by: UserSortBy.CREATED_AT, sort_order: SortOrder.DESC };

  async function addFollow(
    followerId: string,
    followingId: string,
    status: 'accepted' | 'pending' = 'accepted',
  ) {
    await testDb.db.insert(follow).values({ followerId, followingId, status });
  }

  describe('access control', () => {
    it('throws when the target user does not exist', async () => {
      await expect(
        service().listPaginated({
          targetUserId: '00000000-0000-0000-0000-000000000000',
          query: { ...baseQuery, page: 1, per_page: 10 },
          currentUser: null,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('allows anyone to see a public account followers', async () => {
      const { user: target } = await createTestUser(testDb.db);
      const { user: follower } = await createTestUser(testDb.db);
      await addFollow(follower.id, target.id);

      const result = await service().listPaginated({
        targetUserId: target.id,
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: null,
      });

      expect(result.data.map((u) => u.id)).toEqual([follower.id]);
    });

    it('blocks an anonymous viewer from a private account', async () => {
      const { user: target } = await createTestUser(testDb.db, { profile: { isPrivate: true } });

      await expect(
        service().listPaginated({
          targetUserId: target.id,
          query: { ...baseQuery, page: 1, per_page: 10 },
          currentUser: null,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('blocks a logged-in stranger from a private account', async () => {
      const { user: target } = await createTestUser(testDb.db, { profile: { isPrivate: true } });
      const { user: stranger } = await createTestUser(testDb.db);

      await expect(
        service().listPaginated({
          targetUserId: target.id,
          query: { ...baseQuery, page: 1, per_page: 10 },
          currentUser: asUser(stranger),
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('blocks a pending (not-yet-accepted) follower from a private account', async () => {
      const { user: target } = await createTestUser(testDb.db, { profile: { isPrivate: true } });
      const { user: pendingFollower } = await createTestUser(testDb.db);
      await addFollow(pendingFollower.id, target.id, 'pending');

      await expect(
        service().listPaginated({
          targetUserId: target.id,
          query: { ...baseQuery, page: 1, per_page: 10 },
          currentUser: asUser(pendingFollower),
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows an accepted follower to see a private account followers', async () => {
      const { user: target } = await createTestUser(testDb.db, { profile: { isPrivate: true } });
      const { user: acceptedFollower } = await createTestUser(testDb.db);
      await addFollow(acceptedFollower.id, target.id, 'accepted');

      const result = await service().listPaginated({
        targetUserId: target.id,
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: asUser(acceptedFollower),
      });

      expect(result.data.map((u) => u.id)).toEqual([acceptedFollower.id]);
    });

    it('always allows the owner to see their own private followers', async () => {
      const { user: target } = await createTestUser(testDb.db, { profile: { isPrivate: true } });
      const { user: follower } = await createTestUser(testDb.db);
      await addFollow(follower.id, target.id);

      const result = await service().listPaginated({
        targetUserId: target.id,
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: asUser(target),
      });

      expect(result.data.map((u) => u.id)).toEqual([follower.id]);
    });
  });

  describe('listing correctness', () => {
    it('only counts accepted followers, excluding pending ones', async () => {
      const { user: target } = await createTestUser(testDb.db);
      const { user: accepted } = await createTestUser(testDb.db);
      const { user: pending } = await createTestUser(testDb.db);
      await addFollow(accepted.id, target.id, 'accepted');
      await addFollow(pending.id, target.id, 'pending');

      const result = await service().listPaginated({
        targetUserId: target.id,
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: null,
      });

      expect(result.data.map((u) => u.id)).toEqual([accepted.id]);
    });

    it('does not confuse followers with following (direction matters)', async () => {
      const { user: target } = await createTestUser(testDb.db);
      const { user: someoneTargetFollows } = await createTestUser(testDb.db);
      // target follows someone else - this must not show up as target's follower.
      await addFollow(target.id, someoneTargetFollows.id, 'accepted');

      const result = await service().listPaginated({
        targetUserId: target.id,
        query: { ...baseQuery, page: 1, per_page: 10 },
        currentUser: null,
      });

      expect(result.data).toEqual([]);
    });

    it('paginates results and reports accurate meta', async () => {
      const { user: target } = await createTestUser(testDb.db);
      for (let i = 0; i < 3; i++) {
        const { user: follower } = await createTestUser(testDb.db);
        await addFollow(follower.id, target.id);
      }

      const page1 = await service().listPaginated({
        targetUserId: target.id,
        query: { ...baseQuery, page: 1, per_page: 2 },
        currentUser: null,
      });
      expect(page1.data).toHaveLength(2);
      expect(page1.meta).toEqual({
        total_results: 3,
        total_pages: 2,
        current_page: 1,
        per_page: 2,
      });
    });
  });

  describe('listInfinite', () => {
    it('paginates with a cursor until there is no next page', async () => {
      const { user: target } = await createTestUser(testDb.db);
      const followers = [];
      for (let i = 0; i < 3; i++) {
        const { user: follower } = await createTestUser(testDb.db);
        await addFollow(follower.id, target.id);
        followers.push(follower);
      }

      const firstPage = await service().listInfinite({
        targetUserId: target.id,
        query: { ...baseQuery, per_page: 2 },
        currentUser: null,
      });
      expect(firstPage.data).toHaveLength(2);
      expect(firstPage.meta.next_cursor).not.toBeNull();

      const secondPage = await service().listInfinite({
        targetUserId: target.id,
        query: { ...baseQuery, per_page: 2, cursor: firstPage.meta.next_cursor ?? undefined },
        currentUser: null,
      });
      expect(secondPage.data).toHaveLength(1);
      expect(secondPage.meta.next_cursor).toBeNull();

      const allIds = [...firstPage.data, ...secondPage.data].map((u) => u.id).sort();
      expect(allIds).toEqual(followers.map((f) => f.id).sort());
    });

    it('sorts by followers_count', async () => {
      const { user: target } = await createTestUser(testDb.db);
      const { user: popular } = await createTestUser(testDb.db);
      const { user: unpopular } = await createTestUser(testDb.db);
      await addFollow(popular.id, target.id);
      await addFollow(unpopular.id, target.id);
      // Give `popular` its own extra followers so its followers_count is higher.
      const { user: extra } = await createTestUser(testDb.db);
      await addFollow(extra.id, popular.id);

      const result = await service().listInfinite({
        targetUserId: target.id,
        query: { sort_by: UserSortBy.FOLLOWERS_COUNT, sort_order: SortOrder.DESC, per_page: 10 },
        currentUser: null,
      });

      expect(result.data.map((u) => u.id)).toEqual([popular.id, unpopular.id]);
    });
  });
});
