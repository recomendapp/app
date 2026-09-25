import { BadRequestException, NotFoundException } from '@nestjs/common';
import { follow, reco } from '@libs/db/schemas';
import { createTestLogMovie, createTestMovie, createTestUser, TestDatabase } from '@libs/testing';
import { User } from '../../auth/auth.service';
import { RecoType } from '../dto/recos.dto';
import { RecoTargetSortBy } from './dto/reco-targets.dto';
import { SortOrder } from '../../../common/dto/sort.dto';
import { RecoTargetsService } from './reco-targets.service';

describe('RecoTargetsService', () => {
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
  const service = () => new RecoTargetsService(testDb.db);

  async function mutualFollow(userAId: string, userBId: string) {
    await testDb.db
      .insert(follow)
      .values({ followerId: userAId, followingId: userBId, status: 'accepted' });
    await testDb.db
      .insert(follow)
      .values({ followerId: userBId, followingId: userAId, status: 'accepted' });
  }

  const baseQuery = { sort_by: RecoTargetSortBy.RECENTLY_SENT, sort_order: SortOrder.DESC };

  describe('listAll', () => {
    it('returns an empty array when following no one', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);

      const result = await service().listAll({
        currentUser: asUser(user),
        type: RecoType.MOVIE,
        mediaId: movie.id,
        query: baseQuery,
      });

      expect(result).toEqual([]);
    });

    it('excludes a one-way follow (not mutual)', async () => {
      const { user } = await createTestUser(testDb.db);
      const { user: oneWay } = await createTestUser(testDb.db);
      await testDb.db
        .insert(follow)
        .values({ followerId: user.id, followingId: oneWay.id, status: 'accepted' });
      const movie = await createTestMovie(testDb.db);

      const result = await service().listAll({
        currentUser: asUser(user),
        type: RecoType.MOVIE,
        mediaId: movie.id,
        query: baseQuery,
      });

      expect(result).toEqual([]);
    });

    it('includes a mutual follower as a target', async () => {
      const { user } = await createTestUser(testDb.db);
      const { user: friend } = await createTestUser(testDb.db);
      await mutualFollow(user.id, friend.id);
      const movie = await createTestMovie(testDb.db);

      const result = await service().listAll({
        currentUser: asUser(user),
        type: RecoType.MOVIE,
        mediaId: movie.id,
        query: baseQuery,
      });

      expect(result.map((r) => r.id)).toEqual([friend.id]);
      expect(result[0].alreadySeen).toBe(false);
      expect(result[0].alreadySent).toBe(false);
    });

    it('marks alreadySeen when the target already logged the movie', async () => {
      const { user } = await createTestUser(testDb.db);
      const { user: friend } = await createTestUser(testDb.db);
      await mutualFollow(user.id, friend.id);
      const movie = await createTestMovie(testDb.db);
      await createTestLogMovie(testDb.db, { userId: friend.id, movieId: movie.id });

      const [target] = await service().listAll({
        currentUser: asUser(user),
        type: RecoType.MOVIE,
        mediaId: movie.id,
        query: baseQuery,
      });

      expect(target.alreadySeen).toBe(true);
    });

    it('marks alreadySent when an active reco was already sent for that media', async () => {
      const { user } = await createTestUser(testDb.db);
      const { user: friend } = await createTestUser(testDb.db);
      await mutualFollow(user.id, friend.id);
      const movie = await createTestMovie(testDb.db);
      await testDb.db.insert(reco).values({
        userId: friend.id,
        senderId: user.id,
        type: 'movie',
        movieId: movie.id,
        status: 'active',
      });

      const [target] = await service().listAll({
        currentUser: asUser(user),
        type: RecoType.MOVIE,
        mediaId: movie.id,
        query: baseQuery,
      });

      expect(target.alreadySent).toBe(true);
    });

    it('does not mark alreadySent for a deleted reco', async () => {
      const { user } = await createTestUser(testDb.db);
      const { user: friend } = await createTestUser(testDb.db);
      await mutualFollow(user.id, friend.id);
      const movie = await createTestMovie(testDb.db);
      await testDb.db.insert(reco).values({
        userId: friend.id,
        senderId: user.id,
        type: 'movie',
        movieId: movie.id,
        status: 'deleted',
      });

      const [target] = await service().listAll({
        currentUser: asUser(user),
        type: RecoType.MOVIE,
        mediaId: movie.id,
        query: baseQuery,
      });

      expect(target.alreadySent).toBe(false);
    });

    it('filters by username search', async () => {
      const { user } = await createTestUser(testDb.db);
      const { user: match } = await createTestUser(testDb.db, {
        user: { username: 'find_me_pls' },
      });
      const { user: noMatch } = await createTestUser(testDb.db, {
        user: { username: 'someone_else' },
      });
      await mutualFollow(user.id, match.id);
      await mutualFollow(user.id, noMatch.id);
      const movie = await createTestMovie(testDb.db);

      const result = await service().listAll({
        currentUser: asUser(user),
        type: RecoType.MOVIE,
        mediaId: movie.id,
        query: { ...baseQuery, search: 'find_me' },
      });

      expect(result.map((r) => r.id)).toEqual([match.id]);
    });
  });

  describe('listPaginated', () => {
    it('paginates results and reports accurate meta', async () => {
      const { user } = await createTestUser(testDb.db);
      const friends = [];
      for (let i = 0; i < 3; i++) {
        const { user: friend } = await createTestUser(testDb.db);
        await mutualFollow(user.id, friend.id);
        friends.push(friend);
      }
      const movie = await createTestMovie(testDb.db);

      const page1 = await service().listPaginated({
        currentUser: asUser(user),
        type: RecoType.MOVIE,
        mediaId: movie.id,
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
    it('sorts recently_sent so a target with a fresher reco surfaces first', async () => {
      const { user } = await createTestUser(testDb.db);
      const { user: oldFriend } = await createTestUser(testDb.db);
      const { user: freshFriend } = await createTestUser(testDb.db);
      // Both followed at the same instant; only freshFriend gets a reco afterwards, which should
      // push them ahead in a desc "recently sent" ordering.
      await mutualFollow(user.id, oldFriend.id);
      await mutualFollow(user.id, freshFriend.id);
      const movieA = await createTestMovie(testDb.db);
      const movieB = await createTestMovie(testDb.db);
      await testDb.db.insert(reco).values({
        userId: freshFriend.id,
        senderId: user.id,
        type: 'movie',
        movieId: movieA.id,
        status: 'active',
      });

      const result = await service().listInfinite({
        currentUser: asUser(user),
        type: RecoType.MOVIE,
        mediaId: movieB.id,
        query: { ...baseQuery, per_page: 10 },
      });

      expect(result.data.map((r) => r.id)).toEqual([freshFriend.id, oldFriend.id]);
    });

    it('paginates with a cursor until there is no next page', async () => {
      const { user } = await createTestUser(testDb.db);
      const friends = [];
      for (let i = 0; i < 3; i++) {
        const { user: friend } = await createTestUser(testDb.db);
        await mutualFollow(user.id, friend.id);
        friends.push(friend);
      }
      const movie = await createTestMovie(testDb.db);

      const firstPage = await service().listInfinite({
        currentUser: asUser(user),
        type: RecoType.MOVIE,
        mediaId: movie.id,
        query: { ...baseQuery, per_page: 2 },
      });
      expect(firstPage.data).toHaveLength(2);
      expect(firstPage.meta.next_cursor).not.toBeNull();

      const secondPage = await service().listInfinite({
        currentUser: asUser(user),
        type: RecoType.MOVIE,
        mediaId: movie.id,
        query: { ...baseQuery, per_page: 2, cursor: firstPage.meta.next_cursor ?? undefined },
      });
      expect(secondPage.data).toHaveLength(1);
      expect(secondPage.meta.next_cursor).toBeNull();

      const allIds = [...firstPage.data, ...secondPage.data].map((r) => r.id).sort();
      expect(allIds).toEqual(friends.map((f) => f.id).sort());
    });

    it('rejects a cursor that is not valid base64-encoded JSON', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);

      await expect(
        service().listInfinite({
          currentUser: asUser(user),
          type: RecoType.MOVIE,
          mediaId: movie.id,
          query: { ...baseQuery, per_page: 10, cursor: 'not-a-valid-cursor' },
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('media existence', () => {
    it('listAll throws NotFoundException when the movie does not exist', async () => {
      const { user } = await createTestUser(testDb.db);

      await expect(
        service().listAll({
          currentUser: asUser(user),
          type: RecoType.MOVIE,
          mediaId: 999999,
          query: baseQuery,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('listPaginated throws NotFoundException when the tv series does not exist', async () => {
      const { user } = await createTestUser(testDb.db);

      await expect(
        service().listPaginated({
          currentUser: asUser(user),
          type: RecoType.TV_SERIES,
          mediaId: 999999,
          query: { ...baseQuery, page: 1, per_page: 10 },
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('listInfinite throws NotFoundException when the movie does not exist', async () => {
      const { user } = await createTestUser(testDb.db);

      await expect(
        service().listInfinite({
          currentUser: asUser(user),
          type: RecoType.MOVIE,
          mediaId: 999999,
          query: { ...baseQuery, per_page: 10 },
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
