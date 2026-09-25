import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { LexoRank } from 'lexorank';
import { eq } from 'drizzle-orm';
import { playlist, playlistItem, playlistMember } from '@libs/db/schemas';
import {
  createTestMovie,
  createTestPlaylist,
  createTestTvSeries,
  createTestUser,
  TestDatabase,
} from '@libs/testing';
import { defaultSupportedLocale } from '@libs/i18n';
import { SortOrder } from '../../../common/dto/sort.dto';
import type { RealtimeGateway } from '../../realtime/realtime.gateway';
import { PlaylistItemSortBy } from './playlist-items.dto';
import { User } from '../../auth/auth.service';

jest.mock('../../realtime/realtime.gateway', () => ({ RealtimeGateway: jest.fn() }));

const { PlaylistItemsService } =
  require('./playlist-items.service') as typeof import('./playlist-items.service');
const { PlaylistsRealtimeService } =
  require('../playlists-realtime.service') as typeof import('../playlists-realtime.service');

function sequentialRanks(count: number): string[] {
  const ranks: string[] = [];
  let rank = LexoRank.middle();
  for (let i = 0; i < count; i++) {
    ranks.push(rank.toString());
    rank = rank.genNext();
  }
  return ranks;
}

describe('PlaylistItemsService', () => {
  let testDb: TestDatabase;
  const asUser = (row: { id: string }) => row as unknown as User;

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
    const realtime = new PlaylistsRealtimeService(testDb.db, gateway ?? fakeGateway());
    return new PlaylistItemsService(testDb.db, realtime);
  }

  async function addItem(
    playlistId: number,
    userId: string,
    rank: string,
    overrides?: Partial<typeof playlistItem.$inferInsert>,
  ) {
    const movie = await createTestMovie(testDb.db);
    const [row] = await testDb.db
      .insert(playlistItem)
      .values({ playlistId, userId, type: 'movie', movieId: movie.id, rank, ...overrides })
      .returning();
    return row;
  }

  async function orderedIds(playlistId: number): Promise<number[]> {
    const rows = await testDb.db.query.playlistItem.findMany({
      where: eq(playlistItem.playlistId, playlistId),
      orderBy: (item, { asc }) => asc(item.rank),
    });
    return rows.map((r) => r.id);
  }

  async function playlistUpdatedAt(playlistId: number): Promise<string> {
    const row = await testDb.db.query.playlist.findFirst({ where: eq(playlist.id, playlistId) });
    if (!row) throw new Error('playlist not found');
    return row.updatedAt;
  }

  describe('listAll', () => {
    it('filters by type', async () => {
      const { user } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: user.id });
      const [r1, r2] = sequentialRanks(2);
      const movieItem = await addItem(p.id, user.id, r1);
      const tvSeries = await createTestTvSeries(testDb.db);
      await testDb.db.insert(playlistItem).values({
        playlistId: p.id,
        userId: user.id,
        type: 'tv_series',
        tvSeriesId: tvSeries.id,
        rank: r2,
      });

      const service = buildService();
      const result = await service.listAll({
        currentUser: asUser(user),
        playlistId: p.id,
        query: { type: 'movie', sort_by: PlaylistItemSortBy.RANK, sort_order: SortOrder.ASC },
        locale: defaultSupportedLocale,
      });

      expect(result.map((i) => i.id)).toEqual([movieItem.id]);
      expect(result[0].type).toBe('movie');
    });

    it('sorts by rank ascending', async () => {
      const { user } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: user.id });
      const [r1, r2, r3] = sequentialRanks(3);
      const a = await addItem(p.id, user.id, r1);
      const b = await addItem(p.id, user.id, r2);
      const c = await addItem(p.id, user.id, r3);

      const service = buildService();
      const result = await service.listAll({
        currentUser: asUser(user),
        playlistId: p.id,
        query: { sort_by: PlaylistItemSortBy.RANK, sort_order: SortOrder.ASC },
        locale: defaultSupportedLocale,
      });

      expect(result.map((i) => i.id)).toEqual([a.id, b.id, c.id]);
    });

    it('sorts by created_at descending', async () => {
      const { user } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: user.id });
      const [r1, r2] = sequentialRanks(2);
      const first = await addItem(p.id, user.id, r1);
      const second = await addItem(p.id, user.id, r2);

      const service = buildService();
      const result = await service.listAll({
        currentUser: asUser(user),
        playlistId: p.id,
        query: { sort_by: PlaylistItemSortBy.CREATED_AT, sort_order: SortOrder.DESC },
        locale: defaultSupportedLocale,
      });

      expect(result.map((i) => i.id)).toEqual([second.id, first.id]);
    });
  });

  describe('listPaginated', () => {
    it('reports accurate meta', async () => {
      const { user } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: user.id });
      const ranks = sequentialRanks(3);
      for (const rank of ranks) await addItem(p.id, user.id, rank);

      const service = buildService();
      const result = await service.listPaginated({
        currentUser: asUser(user),
        playlistId: p.id,
        query: {
          page: 1,
          per_page: 2,
          sort_by: PlaylistItemSortBy.RANK,
          sort_order: SortOrder.ASC,
        },
        locale: defaultSupportedLocale,
      });

      expect(result.data).toHaveLength(2);
      expect(result.meta).toEqual({
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
      const p = await createTestPlaylist(testDb.db, { userId: user.id });
      const ranks = sequentialRanks(3);
      const items = [];
      for (const rank of ranks) items.push(await addItem(p.id, user.id, rank));

      const service = buildService();
      const firstPage = await service.listInfinite({
        currentUser: asUser(user),
        playlistId: p.id,
        query: { per_page: 2, sort_by: PlaylistItemSortBy.RANK, sort_order: SortOrder.ASC },
        locale: defaultSupportedLocale,
      });
      expect(firstPage.data.map((i) => i.id)).toEqual([items[0].id, items[1].id]);
      expect(firstPage.meta.next_cursor).not.toBeNull();

      const secondPage = await service.listInfinite({
        currentUser: asUser(user),
        playlistId: p.id,
        query: {
          per_page: 2,
          sort_by: PlaylistItemSortBy.RANK,
          sort_order: SortOrder.ASC,
          cursor: firstPage.meta.next_cursor ?? undefined,
        },
        locale: defaultSupportedLocale,
      });
      expect(secondPage.data.map((i) => i.id)).toEqual([items[2].id]);
      expect(secondPage.meta.next_cursor).toBeNull();
    });
  });

  describe('get', () => {
    it('throws when the item does not exist', async () => {
      const { user } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: user.id });
      const service = buildService();

      await expect(
        service.get({
          currentUser: asUser(user),
          playlistId: p.id,
          itemId: 999999,
          locale: defaultSupportedLocale,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns the item with its hydrated movie media', async () => {
      const { user } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: user.id });
      const [r1] = sequentialRanks(1);
      const item = await addItem(p.id, user.id, r1);
      const service = buildService();

      const result = await service.get({
        currentUser: asUser(user),
        playlistId: p.id,
        itemId: item.id,
        locale: defaultSupportedLocale,
      });

      expect(result.type).toBe('movie');
      expect(result.mediaId).toBe(item.movieId);
    });

    it('does not leak an item belonging to another playlist', async () => {
      const { user } = await createTestUser(testDb.db);
      const p1 = await createTestPlaylist(testDb.db, { userId: user.id });
      const p2 = await createTestPlaylist(testDb.db, { userId: user.id });
      const [r1] = sequentialRanks(1);
      const item = await addItem(p1.id, user.id, r1);
      const service = buildService();

      await expect(
        service.get({
          currentUser: asUser(user),
          playlistId: p2.id,
          itemId: item.id,
          locale: defaultSupportedLocale,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('throws when the item does not exist and nothing is being updated', async () => {
      const { user } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: user.id });
      const service = buildService();

      await expect(
        service.update({ user: asUser(user), playlistId: p.id, itemId: 999999, dto: {} as never }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws when the item does not exist and a comment update was requested', async () => {
      const { user } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: user.id });
      const service = buildService();

      await expect(
        service.update({
          user: asUser(user),
          playlistId: p.id,
          itemId: 999999,
          dto: { comment: 'hi' } as never,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates only the comment, leaving the rank untouched', async () => {
      const { user } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: user.id });
      const [r1] = sequentialRanks(1);
      const item = await addItem(p.id, user.id, r1, { comment: 'old' });
      const service = buildService();

      const result = await service.update({
        user: asUser(user),
        playlistId: p.id,
        itemId: item.id,
        dto: { comment: 'new' },
      });

      expect(result.comment).toBe('new');
      expect(result.rank).toBe(r1);
    });

    it('touches the playlist updatedAt when an actual field changes', async () => {
      const { user } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: user.id });
      const [r1] = sequentialRanks(1);
      const item = await addItem(p.id, user.id, r1);
      const before = await playlistUpdatedAt(p.id);
      await new Promise((r) => setTimeout(r, 20));
      const service = buildService();

      await service.update({
        user: asUser(user),
        playlistId: p.id,
        itemId: item.id,
        dto: { comment: 'touched' },
      });

      const after = await playlistUpdatedAt(p.id);
      expect(new Date(after).getTime()).toBeGreaterThan(new Date(before).getTime());
    });

    it('returns the existing item unchanged (and does not touch updatedAt) when the dto is empty', async () => {
      const { user } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: user.id });
      const [r1] = sequentialRanks(1);
      const item = await addItem(p.id, user.id, r1, { comment: 'unchanged' });
      const before = await playlistUpdatedAt(p.id);
      const service = buildService();

      const result = await service.update({
        user: asUser(user),
        playlistId: p.id,
        itemId: item.id,
        dto: {} as never,
      });

      expect(result.comment).toBe('unchanged');
      const after = await playlistUpdatedAt(p.id);
      expect(after).toBe(before);
    });

    describe('repositioning', () => {
      it('moves an item to position 1, before the current first item', async () => {
        const { user } = await createTestUser(testDb.db);
        const p = await createTestPlaylist(testDb.db, { userId: user.id });
        const [r1, r2, r3] = sequentialRanks(3);
        const a = await addItem(p.id, user.id, r1);
        const b = await addItem(p.id, user.id, r2);
        const c = await addItem(p.id, user.id, r3);
        const service = buildService();

        await service.update({
          user: asUser(user),
          playlistId: p.id,
          itemId: c.id,
          dto: { position: 1 } as never,
        });

        expect(await orderedIds(p.id)).toEqual([c.id, a.id, b.id]);
      });

      it('sets the only item to the middle rank when moved to position 1 alone', async () => {
        const { user } = await createTestUser(testDb.db);
        const p = await createTestPlaylist(testDb.db, { userId: user.id });
        const [r1] = sequentialRanks(1);
        const a = await addItem(p.id, user.id, r1);
        const service = buildService();

        const result = await service.update({
          user: asUser(user),
          playlistId: p.id,
          itemId: a.id,
          dto: { position: 1 } as never,
        });

        expect(result.rank).toBe(LexoRank.middle().toString());
      });

      it('inserts an item between its two new neighbors', async () => {
        const { user } = await createTestUser(testDb.db);
        const p = await createTestPlaylist(testDb.db, { userId: user.id });
        const [r1, r2, r3] = sequentialRanks(3);
        const a = await addItem(p.id, user.id, r1);
        const b = await addItem(p.id, user.id, r2);
        const c = await addItem(p.id, user.id, r3);
        const service = buildService();

        // Move `c` (currently last) to position 2, between a and b.
        await service.update({
          user: asUser(user),
          playlistId: p.id,
          itemId: c.id,
          dto: { position: 2 } as never,
        });

        expect(await orderedIds(p.id)).toEqual([a.id, c.id, b.id]);
      });

      it('moves an item to the end when only one neighbor remains before it', async () => {
        const { user } = await createTestUser(testDb.db);
        const p = await createTestPlaylist(testDb.db, { userId: user.id });
        const [r1, r2, r3] = sequentialRanks(3);
        const a = await addItem(p.id, user.id, r1);
        const b = await addItem(p.id, user.id, r2);
        const c = await addItem(p.id, user.id, r3);
        const service = buildService();

        // Move `a` to position 3 (last), leaving only `c` as the preceding neighbor.
        await service.update({
          user: asUser(user),
          playlistId: p.id,
          itemId: a.id,
          dto: { position: 3 } as never,
        });

        expect(await orderedIds(p.id)).toEqual([b.id, c.id, a.id]);
      });

      it('clamps a position far beyond the end to simply the last slot', async () => {
        const { user } = await createTestUser(testDb.db);
        const p = await createTestPlaylist(testDb.db, { userId: user.id });
        const [r1, r2] = sequentialRanks(2);
        const a = await addItem(p.id, user.id, r1);
        const b = await addItem(p.id, user.id, r2);
        const service = buildService();

        await service.update({
          user: asUser(user),
          playlistId: p.id,
          itemId: a.id,
          dto: { position: 999 } as never,
        });

        expect(await orderedIds(p.id)).toEqual([b.id, a.id]);
      });
    });

    it('broadcasts an item-updated event to playlist recipients', async () => {
      const { user } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: user.id });
      const [r1] = sequentialRanks(1);
      const item = await addItem(p.id, user.id, r1);
      const gateway = fakeGateway();
      const service = buildService(gateway);

      await service.update({
        user: asUser(user),
        playlistId: p.id,
        itemId: item.id,
        dto: { comment: 'updated' },
      });

      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(gateway.emitToUsers).toHaveBeenCalledWith(
        [user.id],
        expect.anything(),
        expect.objectContaining({ id: item.id, comment: 'updated' }),
      );
    });
  });

  describe('delete', () => {
    it('returns an empty array and does nothing when given no ids', async () => {
      const { user } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: user.id });
      const service = buildService();

      const result = await service.delete({
        user: asUser(user),
        playlistId: p.id,
        dto: { itemIds: [] },
      });

      expect(result).toEqual([]);
    });

    it('deletes the requested items and deduplicates ids', async () => {
      const { user } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: user.id });
      const [r1, r2] = sequentialRanks(2);
      const a = await addItem(p.id, user.id, r1);
      const b = await addItem(p.id, user.id, r2);
      const service = buildService();

      const result = await service.delete({
        user: asUser(user),
        playlistId: p.id,
        dto: { itemIds: [a.id, a.id, b.id] },
      });

      expect(result.map((i) => i.id).sort()).toEqual([a.id, b.id].sort());
      expect(await orderedIds(p.id)).toEqual([]);
    });

    it('does not delete items from another playlist', async () => {
      const { user } = await createTestUser(testDb.db);
      const p1 = await createTestPlaylist(testDb.db, { userId: user.id });
      const p2 = await createTestPlaylist(testDb.db, { userId: user.id });
      const [r1] = sequentialRanks(1);
      const item = await addItem(p1.id, user.id, r1);
      const service = buildService();

      const result = await service.delete({
        user: asUser(user),
        playlistId: p2.id,
        dto: { itemIds: [item.id] },
      });

      expect(result).toEqual([]);
      expect(await orderedIds(p1.id)).toEqual([item.id]);
    });

    it('decrements the playlist items_count via the counter trigger', async () => {
      const { user } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: user.id });
      const [r1, r2] = sequentialRanks(2);
      const a = await addItem(p.id, user.id, r1);
      await addItem(p.id, user.id, r2);
      const service = buildService();

      await service.delete({ user: asUser(user), playlistId: p.id, dto: { itemIds: [a.id] } });

      const updated = await testDb.db.query.playlist.findFirst({ where: eq(playlist.id, p.id) });
      expect(updated?.itemsCount).toBe(1);
    });
  });

  describe('permissions', () => {
    it('hides the items of a private playlist from a stranger', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: stranger } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(
        testDb.db,
        { userId: owner.id },
        { visibility: 'private' },
      );

      await expect(
        buildService().listAll({
          currentUser: asUser(stranger),
          playlistId: p.id,
          query: { sort_by: PlaylistItemSortBy.RANK, sort_order: SortOrder.ASC },
          locale: defaultSupportedLocale,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('lets an anonymous user list the items of a public playlist', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id }, { visibility: 'public' });
      const [r1] = sequentialRanks(1);
      const item = await addItem(p.id, owner.id, r1);

      const result = await buildService().listAll({
        currentUser: null,
        playlistId: p.id,
        query: { sort_by: PlaylistItemSortBy.RANK, sort_order: SortOrder.ASC },
        locale: defaultSupportedLocale,
      });

      expect(result.map((i) => i.id)).toEqual([item.id]);
    });

    it('forbids a viewer from updating an item', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: viewer } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });
      await testDb.db
        .insert(playlistMember)
        .values({ playlistId: p.id, userId: viewer.id, role: 'viewer' });
      const [r1] = sequentialRanks(1);
      const item = await addItem(p.id, owner.id, r1);

      await expect(
        buildService().update({
          user: asUser(viewer),
          playlistId: p.id,
          itemId: item.id,
          dto: { comment: 'nope' },
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('forbids a stranger from deleting items', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: stranger } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });
      const [r1] = sequentialRanks(1);
      const item = await addItem(p.id, owner.id, r1);

      await expect(
        buildService().delete({
          user: asUser(stranger),
          playlistId: p.id,
          dto: { itemIds: [item.id] },
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
