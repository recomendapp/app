import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { follow, reco } from '@libs/db/schemas';
import { createTestMovie, createTestUser, TestDatabase } from '@libs/testing';
import { defaultSupportedLocale } from '@libs/i18n';
import { User } from '../../auth/auth.service';
import { RecoSortBy, RecoType } from '../../recos/dto/recos.dto';
import { SortOrder } from '../../../common/dto/sort.dto';
import { UserRecosService } from './user-recos.service';

describe('UserRecosService', () => {
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
  const service = () => new UserRecosService(testDb.db);
  const baseQuery = {
    status: 'active' as const,
    sort_by: RecoSortBy.FIRST_SEND_AT,
    sort_order: SortOrder.ASC,
  };

  async function sendReco(senderId: string, targetUserId: string, movieId: number) {
    await testDb.db
      .insert(reco)
      .values({ userId: targetUserId, senderId, movieId, type: RecoType.MOVIE, status: 'active' });
  }

  describe('access control (privacy)', () => {
    it('throws when the target user does not exist', async () => {
      await expect(
        service().listAll({
          targetUserId: '00000000-0000-0000-0000-000000000000',
          query: baseQuery,
          locale: defaultSupportedLocale,
          currentUser: null,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('allows anyone to see recos received by a public account', async () => {
      const { user: target } = await createTestUser(testDb.db);
      const { user: sender } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      await sendReco(sender.id, target.id, movie.id);

      const result = await service().listAll({
        targetUserId: target.id,
        query: baseQuery,
        locale: defaultSupportedLocale,
        currentUser: null,
      });

      expect(result).toHaveLength(1);
    });

    it('blocks an anonymous viewer from a private account recos', async () => {
      const { user: target } = await createTestUser(testDb.db, { profile: { isPrivate: true } });

      await expect(
        service().listAll({
          targetUserId: target.id,
          query: baseQuery,
          locale: defaultSupportedLocale,
          currentUser: null,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('blocks a logged-in stranger from a private account recos', async () => {
      const { user: target } = await createTestUser(testDb.db, { profile: { isPrivate: true } });
      const { user: stranger } = await createTestUser(testDb.db);

      await expect(
        service().listAll({
          targetUserId: target.id,
          query: baseQuery,
          locale: defaultSupportedLocale,
          currentUser: asUser(stranger),
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows an accepted follower to see a private account recos', async () => {
      const { user: target } = await createTestUser(testDb.db, { profile: { isPrivate: true } });
      const { user: follower } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      await sendReco(follower.id, target.id, movie.id);
      await testDb.db
        .insert(follow)
        .values({ followerId: follower.id, followingId: target.id, status: 'accepted' });

      const result = await service().listAll({
        targetUserId: target.id,
        query: baseQuery,
        locale: defaultSupportedLocale,
        currentUser: asUser(follower),
      });

      expect(result).toHaveLength(1);
    });

    it('always allows the owner to see their own private recos', async () => {
      const { user: target } = await createTestUser(testDb.db, { profile: { isPrivate: true } });
      const { user: sender } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      await sendReco(sender.id, target.id, movie.id);

      const result = await service().listAll({
        targetUserId: target.id,
        query: baseQuery,
        locale: defaultSupportedLocale,
        currentUser: asUser(target),
      });

      expect(result).toHaveLength(1);
    });

    it('enforces the same privacy gate on listPaginated', async () => {
      const { user: target } = await createTestUser(testDb.db, { profile: { isPrivate: true } });

      await expect(
        service().listPaginated({
          targetUserId: target.id,
          query: { ...baseQuery, page: 1, per_page: 10 },
          locale: defaultSupportedLocale,
          currentUser: null,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('enforces the same privacy gate on listInfinite', async () => {
      const { user: target } = await createTestUser(testDb.db, { profile: { isPrivate: true } });

      await expect(
        service().listInfinite({
          targetUserId: target.id,
          query: { ...baseQuery, per_page: 10 },
          locale: defaultSupportedLocale,
          currentUser: null,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('grouping', () => {
    it('groups multiple recos of the same media into one entry with all senders', async () => {
      const { user: target } = await createTestUser(testDb.db);
      const { user: senderA } = await createTestUser(testDb.db);
      const { user: senderB } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      await sendReco(senderA.id, target.id, movie.id);
      await sendReco(senderB.id, target.id, movie.id);

      const result = await service().listAll({
        targetUserId: target.id,
        query: baseQuery,
        locale: defaultSupportedLocale,
        currentUser: null,
      });

      expect(result).toHaveLength(1);
      expect(result[0].senders).toHaveLength(2);
      expect(result[0].senders.map((s) => s.user.id).sort()).toEqual(
        [senderA.id, senderB.id].sort(),
      );
    });

    it('does not group recos for different media', async () => {
      const { user: target } = await createTestUser(testDb.db);
      const { user: sender } = await createTestUser(testDb.db);
      const movieA = await createTestMovie(testDb.db);
      const movieB = await createTestMovie(testDb.db);
      await sendReco(sender.id, target.id, movieA.id);
      await sendReco(sender.id, target.id, movieB.id);

      const result = await service().listAll({
        targetUserId: target.id,
        query: baseQuery,
        locale: defaultSupportedLocale,
        currentUser: null,
      });

      expect(result).toHaveLength(2);
    });

    it('only includes recos matching the requested status', async () => {
      const { user: target } = await createTestUser(testDb.db);
      const { user: sender } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      await testDb.db
        .insert(reco)
        .values({
          userId: target.id,
          senderId: sender.id,
          movieId: movie.id,
          type: RecoType.MOVIE,
          status: 'completed',
        });

      const activeResult = await service().listAll({
        targetUserId: target.id,
        query: { ...baseQuery, status: 'active' },
        locale: defaultSupportedLocale,
        currentUser: null,
      });
      expect(activeResult).toEqual([]);

      const completedResult = await service().listAll({
        targetUserId: target.id,
        query: { ...baseQuery, status: 'completed' },
        locale: defaultSupportedLocale,
        currentUser: null,
      });
      expect(completedResult).toHaveLength(1);
    });

    it('filters by media type', async () => {
      const { user: target } = await createTestUser(testDb.db);
      const { user: sender } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      await sendReco(sender.id, target.id, movie.id);

      const result = await service().listAll({
        targetUserId: target.id,
        query: { ...baseQuery, type: RecoType.TV_SERIES },
        locale: defaultSupportedLocale,
        currentUser: null,
      });

      expect(result).toEqual([]);
    });
  });

  describe('listPaginated', () => {
    it('reports accurate meta counting distinct media, not raw reco rows', async () => {
      const { user: target } = await createTestUser(testDb.db);
      const { user: senderA } = await createTestUser(testDb.db);
      const { user: senderB } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      await sendReco(senderA.id, target.id, movie.id);
      await sendReco(senderB.id, target.id, movie.id);

      const result = await service().listPaginated({
        targetUserId: target.id,
        query: { ...baseQuery, page: 1, per_page: 10 },
        locale: defaultSupportedLocale,
        currentUser: null,
      });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total_results).toBe(1);
    });
  });

  describe('listInfinite', () => {
    it('paginates with a cursor until there is no next page', async () => {
      const { user: target } = await createTestUser(testDb.db);
      const { user: sender } = await createTestUser(testDb.db);
      for (let i = 0; i < 3; i++) {
        const movie = await createTestMovie(testDb.db);
        await sendReco(sender.id, target.id, movie.id);
      }

      const firstPage = await service().listInfinite({
        targetUserId: target.id,
        query: { ...baseQuery, per_page: 2 },
        locale: defaultSupportedLocale,
        currentUser: null,
      });
      expect(firstPage.data).toHaveLength(2);
      expect(firstPage.meta.next_cursor).not.toBeNull();

      const secondPage = await service().listInfinite({
        targetUserId: target.id,
        query: { ...baseQuery, per_page: 2, cursor: firstPage.meta.next_cursor ?? undefined },
        locale: defaultSupportedLocale,
        currentUser: null,
      });
      expect(secondPage.data).toHaveLength(1);
      expect(secondPage.meta.next_cursor).toBeNull();
    });

    it('sorts by sender_count descending', async () => {
      const { user: target } = await createTestUser(testDb.db);
      const { user: senderA } = await createTestUser(testDb.db);
      const { user: senderB } = await createTestUser(testDb.db);
      const popular = await createTestMovie(testDb.db);
      const unpopular = await createTestMovie(testDb.db);
      await sendReco(senderA.id, target.id, popular.id);
      await sendReco(senderB.id, target.id, popular.id);
      await sendReco(senderA.id, target.id, unpopular.id);

      const result = await service().listInfinite({
        targetUserId: target.id,
        query: {
          ...baseQuery,
          sort_by: RecoSortBy.SENDER_COUNT,
          sort_order: SortOrder.DESC,
          per_page: 10,
        },
        locale: defaultSupportedLocale,
        currentUser: null,
      });

      expect(result.data.map((r) => r.mediaId)).toEqual([popular.id, unpopular.id]);
    });
  });
});
