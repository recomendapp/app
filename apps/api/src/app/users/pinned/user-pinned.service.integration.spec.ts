import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { follow, pinnedItem, playlist, profile } from '@libs/db/schemas';
import {
  createTestMovie,
  createTestPerson,
  createTestPlaylist,
  createTestTvSeries,
  createTestUser,
  TestDatabase,
} from '@libs/testing';
import { defaultSupportedLocale } from '@libs/i18n';
import { User } from '../../auth/auth.service';
import { PinnedItemWithMovieDto, PinnedItemWithPlaylistDto } from '../../pinned/dto/pinned.dto';
import { UserPinnedService } from './user-pinned.service';

describe('UserPinnedService', () => {
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
  const service = () => new UserPinnedService(testDb.db);

  async function pinMovie(userId: string, rank: string) {
    const movie = await createTestMovie(testDb.db);
    const [row] = await testDb.db
      .insert(pinnedItem)
      .values({ userId, type: 'movie', movieId: movie.id, rank })
      .returning();
    return { movie, row };
  }

  describe('list', () => {
    it('throws when the target user does not exist', async () => {
      await expect(
        service().list({
          targetUserId: '00000000-0000-0000-0000-000000000000',
          currentUser: null,
          locale: defaultSupportedLocale,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('lets an anonymous viewer see a public profile pinned items', async () => {
      const { user: target } = await createTestUser(testDb.db);
      const { movie } = await pinMovie(target.id, 'r0');

      const result = (await service().list({
        targetUserId: target.id,
        currentUser: null,
        locale: defaultSupportedLocale,
      })) as PinnedItemWithMovieDto[];

      expect(result.map((r) => r.data.id)).toEqual([movie.id]);
    });

    it('hides a private profile pinned items from an anonymous viewer', async () => {
      const { user: target } = await createTestUser(testDb.db);
      await testDb.db.update(profile).set({ isPrivate: true }).where(eq(profile.id, target.id));
      await pinMovie(target.id, 'r0');

      await expect(
        service().list({
          targetUserId: target.id,
          currentUser: null,
          locale: defaultSupportedLocale,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('hides a private profile pinned items from a non-follower', async () => {
      const { user: target } = await createTestUser(testDb.db);
      await testDb.db.update(profile).set({ isPrivate: true }).where(eq(profile.id, target.id));
      const { user: stranger } = await createTestUser(testDb.db);

      await expect(
        service().list({
          targetUserId: target.id,
          currentUser: asUser(stranger),
          locale: defaultSupportedLocale,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('hides a private profile pinned items from a pending follower', async () => {
      const { user: target } = await createTestUser(testDb.db);
      await testDb.db.update(profile).set({ isPrivate: true }).where(eq(profile.id, target.id));
      const { user: follower } = await createTestUser(testDb.db);
      await testDb.db
        .insert(follow)
        .values({ followerId: follower.id, followingId: target.id, status: 'pending' });

      await expect(
        service().list({
          targetUserId: target.id,
          currentUser: asUser(follower),
          locale: defaultSupportedLocale,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('shows a private profile pinned items to an accepted follower', async () => {
      const { user: target } = await createTestUser(testDb.db);
      await testDb.db.update(profile).set({ isPrivate: true }).where(eq(profile.id, target.id));
      const { movie } = await pinMovie(target.id, 'r0');
      const { user: follower } = await createTestUser(testDb.db);
      await testDb.db
        .insert(follow)
        .values({ followerId: follower.id, followingId: target.id, status: 'accepted' });

      const result = (await service().list({
        targetUserId: target.id,
        currentUser: asUser(follower),
        locale: defaultSupportedLocale,
      })) as PinnedItemWithMovieDto[];

      expect(result.map((r) => r.data.id)).toEqual([movie.id]);
    });

    it('always lets a user see their own pinned items even when their profile is private', async () => {
      const { user: target } = await createTestUser(testDb.db);
      await testDb.db.update(profile).set({ isPrivate: true }).where(eq(profile.id, target.id));
      await pinMovie(target.id, 'r0');

      const result = await service().list({
        targetUserId: target.id,
        currentUser: asUser(target),
        locale: defaultSupportedLocale,
      });

      expect(result).toHaveLength(1);
    });

    it('returns movie, tv series and person pins with their media attached', async () => {
      const { user: target } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const tvSeries = await createTestTvSeries(testDb.db);
      const person = await createTestPerson(testDb.db);
      await testDb.db.insert(pinnedItem).values([
        { userId: target.id, type: 'movie', movieId: movie.id, rank: 'r0' },
        { userId: target.id, type: 'tv_series', tvSeriesId: tvSeries.id, rank: 'r1' },
        { userId: target.id, type: 'person', personId: person.id, rank: 'r2' },
      ]);

      const result = await service().list({
        targetUserId: target.id,
        currentUser: null,
        locale: defaultSupportedLocale,
      });

      expect(result.map((r) => r.type)).toEqual(['movie', 'tv_series', 'person']);
      expect((result[0] as PinnedItemWithMovieDto).data.id).toBe(movie.id);
    });

    it('orders pinned items by rank', async () => {
      const { user: target } = await createTestUser(testDb.db);
      const { movie: movieB } = await pinMovie(target.id, 'b');
      const { movie: movieA } = await pinMovie(target.id, 'a');

      const result = (await service().list({
        targetUserId: target.id,
        currentUser: null,
        locale: defaultSupportedLocale,
      })) as PinnedItemWithMovieDto[];

      expect(result.map((r) => r.data.id)).toEqual([movieA.id, movieB.id]);
    });

    describe('over the plan limit', () => {
      it('caps a non-owner view at the free limit (4) and excludes the rest', async () => {
        const { user: target } = await createTestUser(testDb.db);
        for (let i = 0; i < 5; i++) {
          await pinMovie(target.id, `r${i}`);
        }
        const { user: viewer } = await createTestUser(testDb.db);

        const result = await service().list({
          targetUserId: target.id,
          currentUser: asUser(viewer),
          locale: defaultSupportedLocale,
        });

        expect(result).toHaveLength(4);
      });

      it('caps a non-owner view at the premium limit (10) for a premium target', async () => {
        const { user: target } = await createTestUser(testDb.db, { profile: { isPremium: true } });
        for (let i = 0; i < 11; i++) {
          await pinMovie(target.id, `r${i}`);
        }

        const result = await service().list({
          targetUserId: target.id,
          currentUser: null,
          locale: defaultSupportedLocale,
        });

        expect(result).toHaveLength(10);
      });

      it('lets the owner see everything, marking items beyond the limit as over_limit', async () => {
        const { user: target } = await createTestUser(testDb.db);
        const pins = [];
        for (let i = 0; i < 5; i++) {
          pins.push(await pinMovie(target.id, `r${i}`));
        }

        const result = (await service().list({
          targetUserId: target.id,
          currentUser: asUser(target),
          locale: defaultSupportedLocale,
        })) as PinnedItemWithMovieDto[];

        expect(result).toHaveLength(5);
        expect(result.slice(0, 4).every((r) => r.status === 'available')).toBe(true);
        expect(result[4].status).toBe('over_limit');
      });
    });

    describe('playlist pins', () => {
      it('shows an accessible playlist pin to a non-owner, with a null role', async () => {
        const { user: target } = await createTestUser(testDb.db);
        const p = await createTestPlaylist(
          testDb.db,
          { userId: target.id },
          { visibility: 'public' },
        );
        await testDb.db
          .insert(pinnedItem)
          .values({ userId: target.id, type: 'playlist', playlistId: p.id, rank: 'r0' });
        const { user: viewer } = await createTestUser(testDb.db);

        const result = (await service().list({
          targetUserId: target.id,
          currentUser: asUser(viewer),
          locale: defaultSupportedLocale,
        })) as PinnedItemWithPlaylistDto[];

        expect(result).toHaveLength(1);
        expect(result[0].data?.id).toBe(p.id);
        expect(result[0].status).toBe('available');
      });

      it('drops an inaccessible playlist pin entirely for a non-owner viewer', async () => {
        const { user: target } = await createTestUser(testDb.db);
        const p = await createTestPlaylist(
          testDb.db,
          { userId: target.id },
          { visibility: 'private' },
        );
        await testDb.db
          .insert(pinnedItem)
          .values({ userId: target.id, type: 'playlist', playlistId: p.id, rank: 'r0' });
        const { user: viewer } = await createTestUser(testDb.db);

        const result = await service().list({
          targetUserId: target.id,
          currentUser: asUser(viewer),
          locale: defaultSupportedLocale,
        });

        expect(result).toEqual([]);
      });

      it('keeps an inaccessible playlist pin for the owner, marked unavailable with null data', async () => {
        const { user: target } = await createTestUser(testDb.db);
        const p = await createTestPlaylist(
          testDb.db,
          { userId: target.id },
          { visibility: 'private' },
        );
        await testDb.db
          .insert(pinnedItem)
          .values({ userId: target.id, type: 'playlist', playlistId: p.id, rank: 'r0' });
        // Make it inaccessible even to the owner by changing ownership after pinning.
        const { user: newOwner } = await createTestUser(testDb.db);
        await testDb.db.update(playlist).set({ userId: newOwner.id }).where(eq(playlist.id, p.id));

        const result = (await service().list({
          targetUserId: target.id,
          currentUser: asUser(target),
          locale: defaultSupportedLocale,
        })) as PinnedItemWithPlaylistDto[];

        expect(result).toHaveLength(1);
        expect(result[0].status).toBe('unavailable');
        expect(result[0].data).toBeNull();
      });
    });
  });
});
