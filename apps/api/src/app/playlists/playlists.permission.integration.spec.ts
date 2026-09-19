import { eq } from 'drizzle-orm';
import { follow, playlistMember } from '@libs/db/schemas';
import { createTestPlaylist, createTestUser, TestDatabase } from '@libs/testing';
import { playlist as playlistTable } from '@libs/db/schemas';
import { User } from '../auth/auth.service';
import { canViewPlaylist } from './playlists.permission';

describe('canViewPlaylist', () => {
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

  async function canSee(playlistId: number, currentUser: User | null): Promise<boolean> {
    const condition = canViewPlaylist(testDb.db, currentUser);
    const row = await testDb.db.query.playlist.findFirst({
      where: (p, { and, eq: eqOp }) => and(eqOp(p.id, playlistId), condition),
      columns: { id: true },
    });
    return !!row;
  }

  describe('anonymous viewer', () => {
    it('can see a public playlist', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id }, { visibility: 'public' });

      expect(await canSee(p.id, null)).toBe(true);
    });

    it('cannot see a private playlist', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(
        testDb.db,
        { userId: owner.id },
        { visibility: 'private' },
      );

      expect(await canSee(p.id, null)).toBe(false);
    });

    it('cannot see a followers-only playlist', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(
        testDb.db,
        { userId: owner.id },
        { visibility: 'followers' },
      );

      expect(await canSee(p.id, null)).toBe(false);
    });
  });

  describe('owner', () => {
    it('can always see their own playlist regardless of visibility', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const priv = await createTestPlaylist(
        testDb.db,
        { userId: owner.id },
        { visibility: 'private' },
      );
      const followers = await createTestPlaylist(
        testDb.db,
        { userId: owner.id },
        { visibility: 'followers' },
      );
      const pub = await createTestPlaylist(
        testDb.db,
        { userId: owner.id },
        { visibility: 'public' },
      );

      expect(await canSee(priv.id, asUser(owner))).toBe(true);
      expect(await canSee(followers.id, asUser(owner))).toBe(true);
      expect(await canSee(pub.id, asUser(owner))).toBe(true);
    });
  });

  describe('member', () => {
    it('can see a private playlist they are a member of', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: member } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(
        testDb.db,
        { userId: owner.id },
        { visibility: 'private' },
      );
      await testDb.db
        .insert(playlistMember)
        .values({ playlistId: p.id, userId: member.id, role: 'viewer' });

      expect(await canSee(p.id, asUser(member))).toBe(true);
    });

    it('a non-member cannot see the same private playlist', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: other } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(
        testDb.db,
        { userId: owner.id },
        { visibility: 'private' },
      );

      expect(await canSee(p.id, asUser(other))).toBe(false);
    });
  });

  describe('followers-only visibility', () => {
    it('an accepted follower can see it', async () => {
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

      expect(await canSee(p.id, asUser(follower))).toBe(true);
    });

    it('a pending follower cannot see it', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: pending } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(
        testDb.db,
        { userId: owner.id },
        { visibility: 'followers' },
      );
      await testDb.db
        .insert(follow)
        .values({ followerId: pending.id, followingId: owner.id, status: 'pending' });

      expect(await canSee(p.id, asUser(pending))).toBe(false);
    });

    it('a stranger cannot see it', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: stranger } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(
        testDb.db,
        { userId: owner.id },
        { visibility: 'followers' },
      );

      expect(await canSee(p.id, asUser(stranger))).toBe(false);
    });

    it('following the owner in the wrong direction does not grant access', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: other } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(
        testDb.db,
        { userId: owner.id },
        { visibility: 'followers' },
      );
      // owner follows `other`, not the other way around.
      await testDb.db
        .insert(follow)
        .values({ followerId: owner.id, followingId: other.id, status: 'accepted' });

      expect(await canSee(p.id, asUser(other))).toBe(false);
    });
  });

  it('an authenticated user can still see public playlists from anyone', async () => {
    const { user: owner } = await createTestUser(testDb.db);
    const { user: viewer } = await createTestUser(testDb.db);
    const p = await createTestPlaylist(testDb.db, { userId: owner.id }, { visibility: 'public' });

    expect(await canSee(p.id, asUser(viewer))).toBe(true);
  });

  it('does not leak deleted-playlist ids as visible', async () => {
    const { user: owner } = await createTestUser(testDb.db);
    const p = await createTestPlaylist(testDb.db, { userId: owner.id }, { visibility: 'public' });
    await testDb.db.delete(playlistTable).where(eq(playlistTable.id, p.id));

    expect(await canSee(p.id, null)).toBe(false);
  });
});
