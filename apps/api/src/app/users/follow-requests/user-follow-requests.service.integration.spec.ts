import { follow } from '@libs/db/schemas';
import { createTestUser, TestDatabase } from '@libs/testing';
import { FollowRequestSortBy } from './dto/user-follow-requests.dto';
import { SortOrder } from '../../../common/dto/sort.dto';
import { UserFollowRequestsService } from './user-follow-requests.service';

describe('UserFollowRequestsService', () => {
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

  const service = () => new UserFollowRequestsService(testDb.db);
  const baseQuery = { sort_by: FollowRequestSortBy.CREATED_AT, sort_order: SortOrder.DESC };

  async function addFollow(
    followerId: string,
    followingId: string,
    status: 'accepted' | 'pending' = 'pending',
  ) {
    await testDb.db.insert(follow).values({ followerId, followingId, status });
  }

  describe('listPaginated', () => {
    it('returns an empty list when there are no pending requests', async () => {
      const { user } = await createTestUser(testDb.db);

      const result = await service().listPaginated({
        currentUserId: user.id,
        query: { ...baseQuery, page: 1, per_page: 10 },
      });

      expect(result.data).toEqual([]);
    });

    it('lists only pending requests targeting the current user', async () => {
      const { user } = await createTestUser(testDb.db);
      const { user: requester } = await createTestUser(testDb.db);
      const { user: alreadyAccepted } = await createTestUser(testDb.db);
      const { user: unrelated } = await createTestUser(testDb.db);
      await addFollow(requester.id, user.id, 'pending');
      await addFollow(alreadyAccepted.id, user.id, 'accepted');
      // A pending request targeting someone else entirely.
      await addFollow(unrelated.id, requester.id, 'pending');

      const result = await service().listPaginated({
        currentUserId: user.id,
        query: { ...baseQuery, page: 1, per_page: 10 },
      });

      expect(result.data.map((r) => r.user.id)).toEqual([requester.id]);
    });

    it('does not leak requests the current user sent to someone else', async () => {
      const { user } = await createTestUser(testDb.db);
      const { user: target } = await createTestUser(testDb.db);
      await addFollow(user.id, target.id, 'pending');

      const result = await service().listPaginated({
        currentUserId: user.id,
        query: { ...baseQuery, page: 1, per_page: 10 },
      });

      expect(result.data).toEqual([]);
    });

    it('paginates results and reports accurate meta', async () => {
      const { user } = await createTestUser(testDb.db);
      for (let i = 0; i < 3; i++) {
        const { user: requester } = await createTestUser(testDb.db);
        await addFollow(requester.id, user.id, 'pending');
      }

      const page1 = await service().listPaginated({
        currentUserId: user.id,
        query: { ...baseQuery, page: 1, per_page: 2 },
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
      const { user } = await createTestUser(testDb.db);
      const requesters = [];
      for (let i = 0; i < 3; i++) {
        const { user: requester } = await createTestUser(testDb.db);
        await addFollow(requester.id, user.id, 'pending');
        requesters.push(requester);
      }

      const firstPage = await service().listInfinite({
        currentUserId: user.id,
        query: { ...baseQuery, per_page: 2 },
      });
      expect(firstPage.data).toHaveLength(2);
      expect(firstPage.meta.next_cursor).not.toBeNull();

      const secondPage = await service().listInfinite({
        currentUserId: user.id,
        query: { ...baseQuery, per_page: 2, cursor: firstPage.meta.next_cursor ?? undefined },
      });
      expect(secondPage.data).toHaveLength(1);
      expect(secondPage.meta.next_cursor).toBeNull();

      const allIds = [...firstPage.data, ...secondPage.data].map((r) => r.user.id).sort();
      expect(allIds).toEqual(requesters.map((r) => r.id).sort());
    });
  });
});
