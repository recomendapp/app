import { BadRequestException, NotFoundException } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { follow } from '@libs/db/schemas';
import { createTestUser, TestDatabase } from '@libs/testing';
import { User } from '../auth/auth.service';
import { UserSortBy } from './dto/users.dto';
import { SortOrder } from '../../common/dto/sort.dto';
import { UsersService } from './users.service';

describe('UsersService', () => {
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

  const asUser = (row: { id: string; username?: string | null }) => row as unknown as User;
  const service = () => new UsersService(testDb.db);

  // The service validates plain-id lookups as UUID v7 (matching how real user ids are
  // generated), but the test fixture's default id is a plain v4 randomUUID(), so tests
  // that look a user up by id need an explicit v7 id.
  const createV7User = (overrides?: Parameters<typeof createTestUser>[1]) =>
    createTestUser(testDb.db, {
      ...overrides,
      user: { id: uuidv7(), ...overrides?.user },
    });

  describe('get', () => {
    it('throws BadRequestException for a malformed id that is neither a UUID nor an @username', async () => {
      await expect(service().get('not-a-valid-identifier', null)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException for an @username with invalid characters', async () => {
      await expect(service().get('@invalid username!', null)).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when no user matches the id', async () => {
      await expect(service().get(uuidv7(), null)).rejects.toThrow(NotFoundException);
    });

    it('finds a user by raw UUID', async () => {
      const { user } = await createV7User();

      const result = await service().get(user.id, null);

      expect(result.id).toBe(user.id);
    });

    it('finds a user by @username, case-insensitively', async () => {
      const { user } = await createV7User({ user: { username: 'someone' } });

      const result = await service().get('@SomeOne', null);

      expect(result.id).toBe(user.id);
    });

    it('lets the owner see their own private profile, marked visible', async () => {
      const { user } = await createV7User({ profile: { isPrivate: true } });

      const result = await service().get(user.id, asUser(user));

      expect(result.isVisible).toBe(true);
    });

    it('marks a public profile as visible to an anonymous viewer', async () => {
      const { user } = await createV7User();

      const result = await service().get(user.id, null);

      expect(result.isVisible).toBe(true);
    });

    it('marks a private profile as not visible to an anonymous viewer', async () => {
      const { user } = await createV7User({ profile: { isPrivate: true } });

      const result = await service().get(user.id, null);

      expect(result.isVisible).toBe(false);
    });

    it('marks a private profile as not visible to a logged-in stranger', async () => {
      const { user } = await createV7User({ profile: { isPrivate: true } });
      const { user: stranger } = await createTestUser(testDb.db);

      const result = await service().get(user.id, asUser(stranger));

      expect(result.isVisible).toBe(false);
    });

    it('marks a private profile as visible to an accepted follower', async () => {
      const { user } = await createV7User({ profile: { isPrivate: true } });
      const { user: follower } = await createTestUser(testDb.db);
      await testDb.db
        .insert(follow)
        .values({ followerId: follower.id, followingId: user.id, status: 'accepted' });

      const result = await service().get(user.id, asUser(follower));

      expect(result.isVisible).toBe(true);
    });

    it('marks a private profile as not visible to a still-pending follower', async () => {
      const { user } = await createV7User({ profile: { isPrivate: true } });
      const { user: follower } = await createTestUser(testDb.db);
      await testDb.db
        .insert(follow)
        .values({ followerId: follower.id, followingId: user.id, status: 'pending' });

      const result = await service().get(user.id, asUser(follower));

      expect(result.isVisible).toBe(false);
    });

    it('exposes accurate followers/following counts', async () => {
      const { user } = await createV7User();
      const { user: followerA } = await createTestUser(testDb.db);
      const { user: followerB } = await createTestUser(testDb.db);
      const { user: followed } = await createTestUser(testDb.db);
      await testDb.db.insert(follow).values([
        { followerId: followerA.id, followingId: user.id, status: 'accepted' },
        { followerId: followerB.id, followingId: user.id, status: 'accepted' },
        { followerId: user.id, followingId: followed.id, status: 'accepted' },
      ]);

      const result = await service().get(user.id, null);

      expect(result.followersCount).toBe(2);
      expect(result.followingCount).toBe(1);
    });
  });

  describe('listPaginated', () => {
    it('paginates results and reports accurate meta', async () => {
      for (let i = 0; i < 3; i++) await createTestUser(testDb.db);

      const result = await service().listPaginated({
        page: 1,
        per_page: 2,
        sort_by: UserSortBy.CREATED_AT,
        sort_order: SortOrder.DESC,
      });

      expect(result.data.length).toBeGreaterThanOrEqual(2);
      expect(result.meta.current_page).toBe(1);
      expect(result.meta.per_page).toBe(2);
    });
  });

  describe('listInfinite', () => {
    it('sorts by followers_count descending', async () => {
      const { user: popular } = await createTestUser(testDb.db);
      const { user: unpopular } = await createTestUser(testDb.db);
      const { user: follower } = await createTestUser(testDb.db);
      await testDb.db
        .insert(follow)
        .values({ followerId: follower.id, followingId: popular.id, status: 'accepted' });

      const result = await service().listInfinite({
        sort_by: UserSortBy.FOLLOWERS_COUNT,
        sort_order: SortOrder.DESC,
        per_page: 100,
      });

      const ids = result.data.map((u) => u.id);
      expect(ids.indexOf(popular.id)).toBeLessThan(ids.indexOf(unpopular.id));
    });
  });
});
