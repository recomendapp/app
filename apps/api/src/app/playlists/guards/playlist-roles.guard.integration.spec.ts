import { ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { profile, playlistMember } from '@libs/db/schemas';
import { createTestPlaylist, createTestUser, TestDatabase } from '@libs/testing';
import { eq } from 'drizzle-orm';
import { User } from '../../auth/auth.service';
import { PlaylistRole } from '../types/playlist-role.type';
import { PlaylistAuthenticatedRequest, PlaylistRolesGuard } from './playlist-roles.guard';

describe('PlaylistRolesGuard', () => {
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

  function fakeReflector(requiredRoles: PlaylistRole[] | undefined): Reflector {
    return { getAllAndOverride: jest.fn().mockReturnValue(requiredRoles) } as unknown as Reflector;
  }

  type TestRequest = PlaylistAuthenticatedRequest & { params: { playlist_id: string } };

  function buildRequest(user: User | null, playlistId: string | number): TestRequest {
    return { user, params: { playlist_id: String(playlistId) } } as TestRequest;
  }

  function contextFor(request: TestRequest) {
    return {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as unknown as ExecutionContext;
  }

  function guard(requiredRoles: PlaylistRole[] | undefined) {
    return new PlaylistRolesGuard(fakeReflector(requiredRoles), testDb.db);
  }

  it('returns false when there is no authenticated user', async () => {
    const context = contextFor(buildRequest(null as never, '1'));

    expect(await guard(undefined).canActivate(context)).toBe(false);
  });

  it('returns false when the playlist_id param is not a number', async () => {
    const { user } = await createTestUser(testDb.db);
    const context = contextFor(buildRequest(asUser(user), 'nope'));

    expect(await guard(undefined).canActivate(context)).toBe(false);
  });

  it('throws NotFoundException when the playlist does not exist', async () => {
    const { user } = await createTestUser(testDb.db);
    const context = contextFor(buildRequest(asUser(user), '999999'));

    await expect(guard(undefined).canActivate(context)).rejects.toThrow(NotFoundException);
  });

  it('passes through and tags the request with the role when no roles are required at all', async () => {
    const { user: owner } = await createTestUser(testDb.db);
    const { user: stranger } = await createTestUser(testDb.db);
    const p = await createTestPlaylist(testDb.db, { userId: owner.id });
    const request = buildRequest(asUser(stranger), String(p.id));

    expect(await guard(undefined).canActivate(contextFor(request))).toBe(true);
    expect(request.playlistRole).toBeNull();
  });

  it('identifies the owner regardless of required roles', async () => {
    const { user: owner } = await createTestUser(testDb.db);
    const p = await createTestPlaylist(testDb.db, { userId: owner.id });
    const request = buildRequest(asUser(owner), String(p.id));

    expect(await guard(['owner']).canActivate(contextFor(request))).toBe(true);
    expect(request.playlistRole).toBe('owner');
  });

  describe('empty role requirement (any member)', () => {
    it('allows the owner', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });
      const request = buildRequest(asUser(owner), String(p.id));

      expect(await guard([]).canActivate(contextFor(request))).toBe(true);
    });

    it('allows a plain viewer member', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: viewer } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });
      await testDb.db
        .insert(playlistMember)
        .values({ playlistId: p.id, userId: viewer.id, role: 'viewer' });
      const request = buildRequest(asUser(viewer), String(p.id));

      expect(await guard([]).canActivate(contextFor(request))).toBe(true);
    });

    it('rejects a non-member', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: stranger } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });
      const request = buildRequest(asUser(stranger), String(p.id));

      await expect(guard([]).canActivate(contextFor(request))).rejects.toThrow(ForbiddenException);
    });
  });

  describe('specific role requirement', () => {
    it('rejects a member whose role is not in the required list', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: editor } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });
      await testDb.db.update(profile).set({ isPremium: true }).where(eq(profile.id, owner.id));
      await testDb.db
        .insert(playlistMember)
        .values({ playlistId: p.id, userId: editor.id, role: 'editor' });
      const request = buildRequest(asUser(editor), String(p.id));

      await expect(guard(['owner', 'admin']).canActivate(contextFor(request))).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('allows a member whose role matches when the owner is premium', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: admin } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });
      await testDb.db.update(profile).set({ isPremium: true }).where(eq(profile.id, owner.id));
      await testDb.db
        .insert(playlistMember)
        .values({ playlistId: p.id, userId: admin.id, role: 'admin' });
      const request = buildRequest(asUser(admin), String(p.id));

      expect(await guard(['owner', 'admin']).canActivate(contextFor(request))).toBe(true);
      expect(request.playlistRole).toBe('admin');
    });

    it("downgrades a member's elevated role to viewer when the owner is not premium, and rejects if viewer isn't allowed", async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: admin } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });
      await testDb.db
        .insert(playlistMember)
        .values({ playlistId: p.id, userId: admin.id, role: 'admin' });
      const request = buildRequest(asUser(admin), String(p.id));

      await expect(guard(['owner', 'admin']).canActivate(contextFor(request))).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('still allows the downgraded viewer when viewer is an accepted role', async () => {
      const { user: owner } = await createTestUser(testDb.db);
      const { user: admin } = await createTestUser(testDb.db);
      const p = await createTestPlaylist(testDb.db, { userId: owner.id });
      await testDb.db
        .insert(playlistMember)
        .values({ playlistId: p.id, userId: admin.id, role: 'admin' });
      const request = buildRequest(asUser(admin), String(p.id));

      expect(await guard(['viewer']).canActivate(contextFor(request))).toBe(true);
      expect(request.playlistRole).toBe('viewer');
    });
  });
});
