import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { pinnedItem, profile } from '@libs/db/schemas';
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
import { PinnedServerEvents } from '@libs/realtime';
import type { RealtimeGateway } from '../../realtime/realtime.gateway';
import { PinnedItemWithMovieDto, PinnedItemWithPlaylistDto } from '../../pinned/dto/pinned.dto';

jest.mock('../../realtime/realtime.gateway', () => ({ RealtimeGateway: jest.fn() }));

const { MePinnedService } = require('./me-pinned.service') as typeof import('./me-pinned.service');

describe('MePinnedService', () => {
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

  function buildService(gateway?: jest.Mocked<RealtimeGateway>) {
    return new MePinnedService(testDb.db, gateway ?? fakeGateway());
  }

  async function pinnedRowsFor(userId: string) {
    return testDb.db
      .select()
      .from(pinnedItem)
      .where(eq(pinnedItem.userId, userId))
      .orderBy(asc(pinnedItem.rank));
  }

  describe('add', () => {
    it('throws when the profile does not exist', async () => {
      const { user } = await createTestUser(testDb.db);
      await testDb.db.delete(profile).where(eq(profile.id, user.id));
      const service = buildService();

      await expect(
        service.add({
          currentUser: asUser(user),
          dto: { type: 'movie', mediaId: 1 },
          locale: defaultSupportedLocale,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws when the movie does not exist', async () => {
      const { user } = await createTestUser(testDb.db);
      const service = buildService();

      await expect(
        service.add({
          currentUser: asUser(user),
          dto: { type: 'movie', mediaId: 999999 },
          locale: defaultSupportedLocale,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('pins a movie', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const service = buildService();

      const result = (await service.add({
        currentUser: asUser(user),
        dto: { type: 'movie', mediaId: movie.id },
        locale: defaultSupportedLocale,
      })) as PinnedItemWithMovieDto;

      expect(result.type).toBe('movie');
      expect(result.data.id).toBe(movie.id);
      expect(result.status).toBe('available');
    });

    it('pins a tv series', async () => {
      const { user } = await createTestUser(testDb.db);
      const tvSeries = await createTestTvSeries(testDb.db);
      const service = buildService();

      const result = await service.add({
        currentUser: asUser(user),
        dto: { type: 'tv_series', mediaId: tvSeries.id },
        locale: defaultSupportedLocale,
      });

      expect(result.type).toBe('tv_series');
    });

    it('pins a person', async () => {
      const { user } = await createTestUser(testDb.db);
      const person = await createTestPerson(testDb.db);
      const service = buildService();

      const result = await service.add({
        currentUser: asUser(user),
        dto: { type: 'person', mediaId: person.id },
        locale: defaultSupportedLocale,
      });

      expect(result.type).toBe('person');
    });

    it('pins an accessible playlist, including its role', async () => {
      const { user } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: user.id }, { visibility: 'private' });
      const service = buildService();

      const result = (await service.add({
        currentUser: asUser(user),
        dto: { type: 'playlist', mediaId: p.id },
        locale: defaultSupportedLocale,
      })) as PinnedItemWithPlaylistDto;

      expect(result.type).toBe('playlist');
      expect(result.data?.id).toBe(p.id);
    });

    it('throws when the playlist is not accessible', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: stranger } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(
        testDb.db,
        { userId: owner.id },
        { visibility: 'private' },
      );
      const service = buildService();

      await expect(
        service.add({
          currentUser: asUser(stranger),
          dto: { type: 'playlist', mediaId: p.id },
          locale: defaultSupportedLocale,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects pinning the same item twice', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const service = buildService();

      await service.add({
        currentUser: asUser(user),
        dto: { type: 'movie', mediaId: movie.id },
        locale: defaultSupportedLocale,
      });

      await expect(
        service.add({
          currentUser: asUser(user),
          dto: { type: 'movie', mediaId: movie.id },
          locale: defaultSupportedLocale,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects pinning a 5th item for a free user, and says it is upgradable', async () => {
      const { user } = await createTestUser(testDb.db);
      const service = buildService();
      for (let i = 0; i < 4; i++) {
        const movie = await createTestMovie(testDb.db);
        await service.add({
          currentUser: asUser(user),
          dto: { type: 'movie', mediaId: movie.id },
          locale: defaultSupportedLocale,
        });
      }
      const fifthMovie = await createTestMovie(testDb.db);

      await expect(
        service.add({
          currentUser: asUser(user),
          dto: { type: 'movie', mediaId: fifthMovie.id },
          locale: defaultSupportedLocale,
        }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({ upgradable: true }),
      });
    });

    it('rejects pinning an 11th item for a premium user, and says it is not upgradable', async () => {
      const { user } = await createTestUser(testDb.db, { profile: { isPremium: true } });
      const service = buildService();
      for (let i = 0; i < 10; i++) {
        const movie = await createTestMovie(testDb.db);
        await service.add({
          currentUser: asUser(user),
          dto: { type: 'movie', mediaId: movie.id },
          locale: defaultSupportedLocale,
        });
      }
      const eleventhMovie = await createTestMovie(testDb.db);

      await expect(
        service.add({
          currentUser: asUser(user),
          dto: { type: 'movie', mediaId: eleventhMovie.id },
          locale: defaultSupportedLocale,
        }),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.add({
          currentUser: asUser(user),
          dto: { type: 'movie', mediaId: eleventhMovie.id },
          locale: defaultSupportedLocale,
        }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({ upgradable: false }),
      });
    });

    it('appends new pins after existing ones by rank', async () => {
      const { user } = await createTestUser(testDb.db);
      const movieA = await createTestMovie(testDb.db);
      const movieB = await createTestMovie(testDb.db);
      const service = buildService();

      await service.add({
        currentUser: asUser(user),
        dto: { type: 'movie', mediaId: movieA.id },
        locale: defaultSupportedLocale,
      });
      await service.add({
        currentUser: asUser(user),
        dto: { type: 'movie', mediaId: movieB.id },
        locale: defaultSupportedLocale,
      });

      const rows = await pinnedRowsFor(user.id);
      expect(rows.map((r) => r.movieId)).toEqual([movieA.id, movieB.id]);
    });

    it('emits a SET realtime event', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);
      const gateway = fakeGateway();
      const service = buildService(gateway);

      const result = await service.add({
        currentUser: asUser(user),
        dto: { type: 'movie', mediaId: movie.id },
        locale: defaultSupportedLocale,
      });

      expect(gateway.emitToUser).toHaveBeenCalledWith(user.id, PinnedServerEvents.SET, result);
    });
  });

  describe('update (reorder)', () => {
    async function pinThreeMovies(userId: string, service: InstanceType<typeof MePinnedService>) {
      const items = [];
      for (let i = 0; i < 3; i++) {
        const movie = await createTestMovie(testDb.db);
        items.push(
          await service.add({
            currentUser: asUser({ id: userId }),
            dto: { type: 'movie', mediaId: movie.id },
            locale: defaultSupportedLocale,
          }),
        );
      }
      return items;
    }

    it('throws when the pinned item does not exist or is not owned', async () => {
      const { user } = await createTestUser(testDb.db);
      const service = buildService();

      await expect(
        service.update({ currentUser: asUser(user), pinnedItemId: 999, dto: { position: 1 } }),
      ).rejects.toThrow(NotFoundException);
    });

    it('moves an item to the front', async () => {
      const { user } = await createTestUser(testDb.db);
      const service = buildService();
      const [first, , third] = await pinThreeMovies(user.id, service);

      await service.update({
        currentUser: asUser(user),
        pinnedItemId: third.id,
        dto: { position: 1 },
      });

      const rows = await pinnedRowsFor(user.id);
      expect(rows[0].id).toBe(third.id);
      expect(rows[1].id).toBe(first.id);
    });

    it('moves an item to the end', async () => {
      const { user } = await createTestUser(testDb.db);
      const service = buildService();
      const [first, second, third] = await pinThreeMovies(user.id, service);

      await service.update({
        currentUser: asUser(user),
        pinnedItemId: first.id,
        dto: { position: 3 },
      });

      const rows = await pinnedRowsFor(user.id);
      expect(rows.map((r) => r.id)).toEqual([second.id, third.id, first.id]);
    });

    it('moves an item to the middle', async () => {
      const { user } = await createTestUser(testDb.db);
      const service = buildService();
      const [first, second, third] = await pinThreeMovies(user.id, service);

      await service.update({
        currentUser: asUser(user),
        pinnedItemId: third.id,
        dto: { position: 2 },
      });

      const rows = await pinnedRowsFor(user.id);
      expect(rows.map((r) => r.id)).toEqual([first.id, third.id, second.id]);
    });

    it('emits a REORDERED realtime event with recomputed status signals', async () => {
      const { user } = await createTestUser(testDb.db);
      const gateway = fakeGateway();
      const service = buildService(gateway);
      const [first, , third] = await pinThreeMovies(user.id, service);

      await service.update({
        currentUser: asUser(user),
        pinnedItemId: third.id,
        dto: { position: 1 },
      });

      expect(gateway.emitToUser).toHaveBeenCalledWith(
        user.id,
        PinnedServerEvents.REORDERED,
        expect.arrayContaining([expect.objectContaining({ id: first.id })]),
      );
    });
  });

  describe('delete', () => {
    it('returns an empty array and does nothing for an empty id list', async () => {
      const { user } = await createTestUser(testDb.db);
      const service = buildService();

      await expect(
        service.delete({ currentUser: asUser(user), dto: { itemIds: [] } }),
      ).resolves.toEqual([]);
    });

    it('deletes only the current user own pinned items', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: stranger } = await createTestUser(testDb.db);
      const service = buildService();
      const movie = await createTestMovie(testDb.db);
      const pinned = await service.add({
        currentUser: asUser(owner),
        dto: { type: 'movie', mediaId: movie.id },
        locale: defaultSupportedLocale,
      });

      const result = await service.delete({
        currentUser: asUser(stranger),
        dto: { itemIds: [pinned.id] },
      });

      expect(result).toEqual([]);
      const rows = await pinnedRowsFor(owner.id);
      expect(rows).toHaveLength(1);
    });

    it('deduplicates the requested ids', async () => {
      const { user } = await createTestUser(testDb.db);
      const service = buildService();
      const movie = await createTestMovie(testDb.db);
      const pinned = await service.add({
        currentUser: asUser(user),
        dto: { type: 'movie', mediaId: movie.id },
        locale: defaultSupportedLocale,
      });

      const result = await service.delete({
        currentUser: asUser(user),
        dto: { itemIds: [pinned.id, pinned.id] },
      });

      expect(result).toHaveLength(1);
    });

    it('emits a DELETED realtime event with the deleted ids and updated status signals', async () => {
      const { user } = await createTestUser(testDb.db);
      const gateway = fakeGateway();
      const service = buildService(gateway);
      const movie = await createTestMovie(testDb.db);
      const pinned = await service.add({
        currentUser: asUser(user),
        dto: { type: 'movie', mediaId: movie.id },
        locale: defaultSupportedLocale,
      });

      await service.delete({ currentUser: asUser(user), dto: { itemIds: [pinned.id] } });

      expect(gateway.emitToUser).toHaveBeenCalledWith(user.id, PinnedServerEvents.DELETED, {
        userId: user.id,
        deleted: [pinned.id],
        updated: [],
      });
    });

    it('does not emit when nothing was deleted', async () => {
      const { user } = await createTestUser(testDb.db);
      const gateway = fakeGateway();
      const service = buildService(gateway);

      await service.delete({ currentUser: asUser(user), dto: { itemIds: [999] } });

      expect(gateway.emitToUser).not.toHaveBeenCalled();
    });

    it('frees up a slot: an item bumped over the limit becomes available again after a delete', async () => {
      const { user } = await createTestUser(testDb.db);
      // Raw inserts with simple lexicographically-ordered ranks — simulates a free user sitting
      // at 5 pins (e.g. after a premium->free downgrade), one beyond their limit of 4.
      const rows = [];
      for (let i = 0; i < 5; i++) {
        const movie = await createTestMovie(testDb.db);
        const [row] = await testDb.db
          .insert(pinnedItem)
          .values({ userId: user.id, type: 'movie', movieId: movie.id, rank: `rank-${i}` })
          .returning();
        rows.push(row);
      }

      const gateway = fakeGateway();
      const service = buildService(gateway);
      await service.delete({ currentUser: asUser(user), dto: { itemIds: [rows[0].id] } });

      expect(gateway.emitToUser).toHaveBeenCalledWith(
        user.id,
        PinnedServerEvents.DELETED,
        expect.objectContaining({
          updated: expect.arrayContaining([
            expect.objectContaining({ id: rows[4].id, status: 'available' }),
          ]),
        }),
      );
    });
  });
});
