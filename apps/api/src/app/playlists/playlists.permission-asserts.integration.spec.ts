import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { follow, playlistMember, profile } from '@libs/db/schemas';
import { createTestPlaylist, createTestUser, TestDatabase } from '@libs/testing';
import { User } from '../auth/auth.service';
import { assertPlaylistRole, assertPlaylistVisible, getPlaylistRole } from './playlists.permission';

describe('playlist permission asserts', () => {
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

  async function makePremium(userId: string) {
    await testDb.db.update(profile).set({ isPremium: true }).where(eq(profile.id, userId));
  }

  async function addMember(
    playlistId: number,
    userId: string,
    role: 'viewer' | 'editor' | 'admin',
  ) {
    await testDb.db.insert(playlistMember).values({ playlistId, userId, role });
  }

  describe('getPlaylistRole', () => {
    it('throws NotFoundException when the playlist does not exist', async () => {
      const { user } = await createTestUser(testDb.db);

      await expect(getPlaylistRole(testDb.db, asUser(user), 999999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns owner for the owner', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });

      expect(await getPlaylistRole(testDb.db, asUser(owner), p.id)).toBe('owner');
    });

    it('returns null for a non-member', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: stranger } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });

      expect(await getPlaylistRole(testDb.db, asUser(stranger), p.id)).toBeNull();
    });

    it('returns the member role when the owner is premium', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: admin } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });
      await makePremium(owner.id);
      await addMember(p.id, admin.id, 'admin');

      expect(await getPlaylistRole(testDb.db, asUser(admin), p.id)).toBe('admin');
    });

    it('downgrades an elevated member to viewer when the owner is not premium', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: admin } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });
      await addMember(p.id, admin.id, 'admin');

      expect(await getPlaylistRole(testDb.db, asUser(admin), p.id)).toBe('viewer');
    });
  });

  describe('assertPlaylistRole', () => {
    it('allows any member when no role is required', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: viewer } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });
      await addMember(p.id, viewer.id, 'viewer');

      expect(await assertPlaylistRole(testDb.db, asUser(viewer), p.id, [])).toBe('viewer');
    });

    it('rejects a non-member even when no role is required', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: stranger } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });

      await expect(assertPlaylistRole(testDb.db, asUser(stranger), p.id, [])).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('rejects a member whose role is not allowed', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: editor } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });
      await makePremium(owner.id);
      await addMember(p.id, editor.id, 'editor');

      await expect(
        assertPlaylistRole(testDb.db, asUser(editor), p.id, ['owner', 'admin']),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects a downgraded admin of a non-premium owner', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: admin } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });
      await addMember(p.id, admin.id, 'admin');

      await expect(
        assertPlaylistRole(testDb.db, asUser(admin), p.id, ['owner', 'admin']),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows a member whose role is allowed', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: admin } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });
      await makePremium(owner.id);
      await addMember(p.id, admin.id, 'admin');

      expect(await assertPlaylistRole(testDb.db, asUser(admin), p.id, ['owner', 'admin'])).toBe(
        'admin',
      );
    });
  });

  describe('assertPlaylistVisible', () => {
    it('throws NotFoundException when the playlist does not exist', async () => {
      await expect(assertPlaylistVisible(testDb.db, null, 999999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('allows an anonymous user to view a public playlist', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id }, { visibility: 'public' });

      await expect(assertPlaylistVisible(testDb.db, null, p.id)).resolves.toBeUndefined();
    });

    it('hides a private playlist from a stranger behind a NotFoundException', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: stranger } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(
        testDb.db,
        { userId: owner.id },
        { visibility: 'private' },
      );

      await expect(assertPlaylistVisible(testDb.db, asUser(stranger), p.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('allows the owner to view their own private playlist', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(
        testDb.db,
        { userId: owner.id },
        { visibility: 'private' },
      );

      await expect(assertPlaylistVisible(testDb.db, asUser(owner), p.id)).resolves.toBeUndefined();
    });

    it('allows an accepted follower to view a followers-only playlist', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: follower } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(
        testDb.db,
        { userId: owner.id },
        { visibility: 'followers' },
      );
      await testDb.db
        .insert(follow)
        .values({ followerId: follower.id, followingId: owner.id, status: 'accepted' });

      await expect(
        assertPlaylistVisible(testDb.db, asUser(follower), p.id),
      ).resolves.toBeUndefined();
    });

    it('blocks a non-follower from a followers-only playlist', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: stranger } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(
        testDb.db,
        { userId: owner.id },
        { visibility: 'followers' },
      );

      await expect(assertPlaylistVisible(testDb.db, asUser(stranger), p.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
