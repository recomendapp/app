import { NotFoundException, ExecutionContext } from '@nestjs/common';
import { follow } from '@libs/db/schemas';
import { createTestPlaylist, createTestUser, TestDatabase } from '@libs/testing';
import { User } from '../../auth/auth.service';
import { PlaylistVisibilityGuard } from './playlist-visibility.guard';

describe('PlaylistVisibilityGuard', () => {
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

  function contextFor(user: User | null, playlistId: string | number): ExecutionContext {
    const request = { user, params: { playlist_id: String(playlistId) } };
    return {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
  }

  const guard = () => new PlaylistVisibilityGuard(testDb.db);

  it('returns false when the playlist_id param is not a number', async () => {
    const result = await guard().canActivate(contextFor(null, 'not-a-number'));

    expect(result).toBe(false);
  });

  it('throws NotFoundException when the playlist does not exist', async () => {
    await expect(guard().canActivate(contextFor(null, 999999))).rejects.toThrow(NotFoundException);
  });

  it('allows an anonymous user to view a public playlist', async () => {
    const { user: owner } = await createTestUser(testDb.db);
    const p = await createTestPlaylist(testDb.db, { userId: owner.id }, { visibility: 'public' });

    expect(await guard().canActivate(contextFor(null, p.id))).toBe(true);
  });

  it('hides a private playlist from an anonymous user behind a 404', async () => {
    const { user: owner } = await createTestUser(testDb.db);
    const p = await createTestPlaylist(testDb.db, { userId: owner.id }, { visibility: 'private' });

    await expect(guard().canActivate(contextFor(null, p.id))).rejects.toThrow(NotFoundException);
  });

  it('hides a private playlist from a logged-in stranger behind a 404', async () => {
    const { user: owner } = await createTestUser(testDb.db);
    const { user: stranger } = await createTestUser(testDb.db);
    const p = await createTestPlaylist(testDb.db, { userId: owner.id }, { visibility: 'private' });

    await expect(guard().canActivate(contextFor(asUser(stranger), p.id))).rejects.toThrow(
      NotFoundException,
    );
  });

  it('allows the owner to view their own private playlist', async () => {
    const { user: owner } = await createTestUser(testDb.db);
    const p = await createTestPlaylist(testDb.db, { userId: owner.id }, { visibility: 'private' });

    expect(await guard().canActivate(contextFor(asUser(owner), p.id))).toBe(true);
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

    expect(await guard().canActivate(contextFor(asUser(follower), p.id))).toBe(true);
  });

  it('blocks a non-follower from a followers-only playlist', async () => {
    const { user: owner } = await createTestUser(testDb.db);
    const { user: stranger } = await createTestUser(testDb.db);
    const p = await createTestPlaylist(
      testDb.db,
      { userId: owner.id },
      { visibility: 'followers' },
    );

    await expect(guard().canActivate(contextFor(asUser(stranger), p.id))).rejects.toThrow(
      NotFoundException,
    );
  });
});
