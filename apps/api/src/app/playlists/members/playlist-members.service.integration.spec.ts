import { ForbiddenException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { playlistMember, profile } from '@libs/db/schemas';
import { createTestPlaylist, createTestUser, TestDatabase } from '@libs/testing';
import type { WorkerClient } from '@shared/worker';
import { SortOrder } from '../../../common/dto/sort.dto';
import { PlaylistMemberSortBy } from './playlist-members.dto';
import { PlaylistMembersService } from './playlist-members.service';

describe('PlaylistMembersService', () => {
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

  const fakeWorker = () =>
    ({ emit: jest.fn().mockResolvedValue(undefined) }) as unknown as jest.Mocked<WorkerClient>;
  const service = (worker?: jest.Mocked<WorkerClient>) =>
    new PlaylistMembersService(testDb.db, worker ?? fakeWorker());

  async function addMember(
    playlistId: number,
    userId: string,
    role: 'viewer' | 'editor' | 'admin' = 'viewer',
  ) {
    const [row] = await testDb.db
      .insert(playlistMember)
      .values({ playlistId, userId, role })
      .returning();
    return row;
  }

  const baseQuery = { sort_by: PlaylistMemberSortBy.CREATED_AT, sort_order: SortOrder.DESC };

  describe('listAll', () => {
    it('lists members with their user summary', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: member } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });
      await addMember(p.id, member.id, 'editor');

      const result = await service().listAll({ playlistId: p.id, query: baseQuery });

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe(member.id);
      expect(result[0].user.id).toBe(member.id);
      expect(result[0].role).toBe('editor');
    });

    it('filters by username search', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: alice } = await createTestUser(testDb.db, {
        user: { username: 'alice_wonder' },
      });
      const { user: bob } = await createTestUser(testDb.db, { user: { username: 'bob_builder' } });
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });
      await addMember(p.id, alice.id);
      await addMember(p.id, bob.id);

      const result = await service().listAll({
        playlistId: p.id,
        query: { ...baseQuery, search: 'alice' },
      });

      expect(result.map((m) => m.userId)).toEqual([alice.id]);
    });

    it('does not leak members from another playlist', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: member } = await createTestUser(testDb.db);
      const p1 = await createTestPlaylist(testDb.db, { userId: owner.id });
      const p2 = await createTestPlaylist(testDb.db, { userId: owner.id });
      await addMember(p1.id, member.id);

      const result = await service().listAll({ playlistId: p2.id, query: baseQuery });

      expect(result).toEqual([]);
    });
  });

  describe('listPaginated', () => {
    it('reports accurate meta', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });
      for (let i = 0; i < 3; i++) {
        const { user } = await createTestUser(testDb.db);
        await addMember(p.id, user.id);
      }

      const result = await service().listPaginated({
        playlistId: p.id,
        query: { ...baseQuery, page: 1, per_page: 2 },
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
      const { user: owner } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });
      const members = [];
      for (let i = 0; i < 3; i++) {
        const { user } = await createTestUser(testDb.db);
        members.push(await addMember(p.id, user.id));
      }

      const firstPage = await service().listInfinite({
        playlistId: p.id,
        query: { ...baseQuery, per_page: 2 },
      });
      expect(firstPage.data).toHaveLength(2);
      expect(firstPage.meta.next_cursor).not.toBeNull();

      const secondPage = await service().listInfinite({
        playlistId: p.id,
        query: { ...baseQuery, per_page: 2, cursor: firstPage.meta.next_cursor ?? undefined },
      });
      expect(secondPage.data).toHaveLength(1);
      expect(secondPage.meta.next_cursor).toBeNull();
    });
  });

  describe('add', () => {
    it('returns an empty array and does nothing when given no ids', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });

      const result = await service().add({ playlistId: p.id, dto: { userIds: [] } });

      expect(result).toEqual([]);
    });

    it('adds members as viewer by default', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: a } = await createTestUser(testDb.db);
      const { user: b } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });

      const result = await service().add({ playlistId: p.id, dto: { userIds: [a.id, b.id] } });

      expect(result).toHaveLength(2);
      expect(result.every((m) => m.role === 'viewer')).toBe(true);
    });

    it('ignores users who are already members', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: a } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });
      await addMember(p.id, a.id, 'admin');

      const result = await service().add({ playlistId: p.id, dto: { userIds: [a.id] } });

      expect(result).toEqual([]);
      const stored = await testDb.db.query.playlistMember.findFirst({
        where: eq(playlistMember.userId, a.id),
      });
      expect(stored?.role).toBe('admin');
    });

    it('fires a search sync event only when members were actually inserted', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: a } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });
      const worker = fakeWorker();

      await service(worker).add({ playlistId: p.id, dto: { userIds: [a.id] } });

      expect(worker.emit).toHaveBeenCalledWith(
        'search:sync-playlist',
        expect.objectContaining({ action: 'upsert' }),
      );

      worker.emit.mockClear();
      await service(worker).add({ playlistId: p.id, dto: { userIds: [a.id] } });
      expect(worker.emit).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('throws when the target user is not a member', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: stranger } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });

      await expect(
        service().update({ playlistId: p.id, targetUserId: stranger.id, dto: { role: 'viewer' } }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows demoting a member to viewer even when the owner is not premium', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: member } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });
      await addMember(p.id, member.id, 'editor');

      const result = await service().update({
        playlistId: p.id,
        targetUserId: member.id,
        dto: { role: 'viewer' },
      });

      expect(result.role).toBe('viewer');
    });

    it('forbids assigning an elevated role when the playlist owner is not premium', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: member } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });
      await addMember(p.id, member.id, 'viewer');

      await expect(
        service().update({ playlistId: p.id, targetUserId: member.id, dto: { role: 'admin' } }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows assigning an elevated role when the playlist owner is premium', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: member } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });
      await testDb.db.update(profile).set({ isPremium: true }).where(eq(profile.id, owner.id));
      await addMember(p.id, member.id, 'viewer');

      const result = await service().update({
        playlistId: p.id,
        targetUserId: member.id,
        dto: { role: 'admin' },
      });

      expect(result.role).toBe('admin');
    });
  });

  describe('delete', () => {
    it('returns an empty array and does nothing when given no ids', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });

      const result = await service().delete({ playlistId: p.id, userIds: [] });

      expect(result).toEqual([]);
    });

    it('removes the requested members', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: a } = await createTestUser(testDb.db);
      const { user: b } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });
      await addMember(p.id, a.id);
      await addMember(p.id, b.id);

      const result = await service().delete({ playlistId: p.id, userIds: [a.id] });

      expect(result.map((m) => m.userId)).toEqual([a.id]);
      const remaining = await testDb.db.query.playlistMember.findMany({
        where: eq(playlistMember.playlistId, p.id),
      });
      expect(remaining.map((m) => m.userId)).toEqual([b.id]);
    });

    it('does not remove members from another playlist', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: a } = await createTestUser(testDb.db);
      const p1 = await createTestPlaylist(testDb.db, { userId: owner.id });
      const p2 = await createTestPlaylist(testDb.db, { userId: owner.id });
      await addMember(p1.id, a.id);

      const result = await service().delete({ playlistId: p2.id, userIds: [a.id] });

      expect(result).toEqual([]);
      const stillThere = await testDb.db.query.playlistMember.findFirst({
        where: eq(playlistMember.playlistId, p1.id),
      });
      expect(stillThere).toBeDefined();
    });
  });
});
