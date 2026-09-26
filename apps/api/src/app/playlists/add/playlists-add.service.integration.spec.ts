import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { playlistItem, playlistMember, profile } from '@libs/db/schemas';
import { createTestMovie, createTestPlaylist, createTestUser, TestDatabase } from '@libs/testing';
import type { RealtimeGateway } from '../../realtime/realtime.gateway';
import { User } from '../../auth/auth.service';

jest.mock('../../realtime/realtime.gateway', () => ({ RealtimeGateway: jest.fn() }));

const { PlaylistsAddService } =
  require('./playlists-add.service') as typeof import('./playlists-add.service');
const { PlaylistsRealtimeService } =
  require('../playlists-realtime.service') as typeof import('../playlists-realtime.service');

describe('PlaylistsAddService', () => {
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
  const fakeGateway = () =>
    ({ emitToUser: jest.fn(), emitToUsers: jest.fn() }) as unknown as jest.Mocked<RealtimeGateway>;
  const service = (gateway?: jest.Mocked<RealtimeGateway>) =>
    new PlaylistsAddService(
      testDb.db,
      new PlaylistsRealtimeService(testDb.db, gateway ?? fakeGateway()),
    );

  describe('permissions', () => {
    it('returns an empty array and does nothing when given no playlist ids', async () => {
      const { user } = await createTestUser(testDb.db);
      const movie = await createTestMovie(testDb.db);

      const result = await service().add({
        user: asUser(user),
        type: 'movie',
        mediaId: movie.id,
        dto: { playlistIds: [], comment: null },
      });

      expect(result).toEqual([]);
    });

    it('allows the owner to add to their own playlist', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });
      const movie = await createTestMovie(testDb.db);

      const result = await service().add({
        user: asUser(owner),
        type: 'movie',
        mediaId: movie.id,
        dto: { playlistIds: [p.id], comment: null },
      });

      expect(result).toHaveLength(1);
      expect(result[0].playlistId).toBe(p.id);
      expect(result[0].mediaId).toBe(movie.id);
    });

    it('forbids a viewer member from adding items', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: viewer } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });
      await testDb.db
        .insert(playlistMember)
        .values({ playlistId: p.id, userId: viewer.id, role: 'viewer' });
      const movie = await createTestMovie(testDb.db);

      await expect(
        service().add({
          user: asUser(viewer),
          type: 'movie',
          mediaId: movie.id,
          dto: { playlistIds: [p.id], comment: null },
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('forbids an editor/admin member when the owner is not premium', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: editor } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });
      await testDb.db
        .insert(playlistMember)
        .values({ playlistId: p.id, userId: editor.id, role: 'editor' });
      const movie = await createTestMovie(testDb.db);

      await expect(
        service().add({
          user: asUser(editor),
          type: 'movie',
          mediaId: movie.id,
          dto: { playlistIds: [p.id], comment: null },
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows an editor member to add items when the owner is premium', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: editor } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });
      await testDb.db.update(profile).set({ isPremium: true }).where(eq(profile.id, owner.id));
      await testDb.db
        .insert(playlistMember)
        .values({ playlistId: p.id, userId: editor.id, role: 'editor' });
      const movie = await createTestMovie(testDb.db);

      const result = await service().add({
        user: asUser(editor),
        type: 'movie',
        mediaId: movie.id,
        dto: { playlistIds: [p.id], comment: null },
      });

      expect(result).toHaveLength(1);
    });

    it('forbids a non-member entirely', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: stranger } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });
      const movie = await createTestMovie(testDb.db);

      await expect(
        service().add({
          user: asUser(stranger),
          type: 'movie',
          mediaId: movie.id,
          dto: { playlistIds: [p.id], comment: null },
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('adds only to the authorized playlists among a mixed batch, skipping unauthorized ones', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: stranger } = await createTestUser(testDb.db);
      const mine = await createTestPlaylist(testDb.db, { userId: owner.id });
      const notMine = await createTestPlaylist(testDb.db, { userId: stranger.id });
      const movie = await createTestMovie(testDb.db);

      const result = await service().add({
        user: asUser(owner),
        type: 'movie',
        mediaId: movie.id,
        dto: { playlistIds: [mine.id, notMine.id], comment: null },
      });

      expect(result.map((i) => i.playlistId)).toEqual([mine.id]);
    });

    it('deduplicates repeated playlist ids', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });
      const movie = await createTestMovie(testDb.db);

      const result = await service().add({
        user: asUser(owner),
        type: 'movie',
        mediaId: movie.id,
        dto: { playlistIds: [p.id, p.id], comment: null },
      });

      expect(result).toHaveLength(1);
    });
  });

  describe('ranking', () => {
    it('places the item after existing items using the next rank', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });
      const firstMovie = await createTestMovie(testDb.db);
      const secondMovie = await createTestMovie(testDb.db);

      await service().add({
        user: asUser(owner),
        type: 'movie',
        mediaId: firstMovie.id,
        dto: { playlistIds: [p.id], comment: null },
      });
      await service().add({
        user: asUser(owner),
        type: 'movie',
        mediaId: secondMovie.id,
        dto: { playlistIds: [p.id], comment: null },
      });

      const rows = await testDb.db.query.playlistItem.findMany({
        where: eq(playlistItem.playlistId, p.id),
        orderBy: (item, { asc }) => asc(item.rank),
      });
      expect(rows.map((r) => r.movieId)).toEqual([firstMovie.id, secondMovie.id]);
    });

    it('assigns independent ranks per playlist in a multi-playlist add', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const p1 = await createTestPlaylist(testDb.db, { userId: owner.id });
      const p2 = await createTestPlaylist(testDb.db, { userId: owner.id });
      const movie = await createTestMovie(testDb.db);

      const result = await service().add({
        user: asUser(owner),
        type: 'movie',
        mediaId: movie.id,
        dto: { playlistIds: [p1.id, p2.id], comment: 'shared comment' },
      });

      expect(result).toHaveLength(2);
      expect(result.every((i) => i.comment === 'shared comment')).toBe(true);
      expect(new Set(result.map((i) => i.playlistId))).toEqual(new Set([p1.id, p2.id]));
    });
  });

  it('increments items_count via the counter trigger', async () => {
    const { user: owner } = await createTestUser(testDb.db);
    const p = await createTestPlaylist(testDb.db, { userId: owner.id });
    const movie = await createTestMovie(testDb.db);

    await service().add({
      user: asUser(owner),
      type: 'movie',
      mediaId: movie.id,
      dto: { playlistIds: [p.id], comment: null },
    });

    const updated = await testDb.db.query.playlist.findFirst({
      where: (pl, { eq: eqOp }) => eqOp(pl.id, p.id),
    });
    expect(updated?.itemsCount).toBe(1);
  });

  describe('media existence', () => {
    it('throws NotFoundException when the movie does not exist', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });

      await expect(
        service().add({
          user: asUser(owner),
          type: 'movie',
          mediaId: 999999,
          dto: { playlistIds: [p.id], comment: null },
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the tv series does not exist', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });

      await expect(
        service().add({
          user: asUser(owner),
          type: 'tv_series',
          mediaId: 999999,
          dto: { playlistIds: [p.id], comment: null },
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
