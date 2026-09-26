import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { SQL, and, eq, exists, or, sql } from 'drizzle-orm';
import { follow, playlist, playlistMember, profile } from '@libs/db/schemas';
import { DbTransaction } from '@libs/db';
import { User } from '../auth/auth.service';
import { DrizzleService } from '../../common/modules/drizzle/drizzle.module';
import { PlaylistRole } from './types/playlist-role.type';

export function canViewPlaylist(db: DbTransaction | DrizzleService, currentUser: User | null): SQL {
  if (!currentUser) {
    return eq(playlist.visibility, 'public');
  }

  const isMemberQuery = db
    .select({ id: playlistMember.id })
    .from(playlistMember)
    .where(
      and(eq(playlistMember.playlistId, playlist.id), eq(playlistMember.userId, currentUser.id)),
    );

  const isFollowerQuery = db
    .select({ followingId: follow.followingId })
    .from(follow)
    .where(
      and(
        eq(follow.followerId, currentUser.id),
        eq(follow.followingId, playlist.userId),
        eq(follow.status, 'accepted'),
      ),
    );

  return or(
    eq(playlist.visibility, 'public'),
    eq(playlist.userId, currentUser.id),
    exists(isMemberQuery),
    and(eq(playlist.visibility, 'followers'), exists(isFollowerQuery)),
  );
}

// Resolves the role of `user` in the playlist, like getRoleSelection: members of a non-premium
// owner are downgraded to viewer. Throws NotFoundException when the playlist does not exist.
export async function getPlaylistRole(
  db: DbTransaction | DrizzleService,
  user: User,
  playlistId: number,
): Promise<PlaylistRole | null> {
  const [access] = await db
    .select({
      isOwner: sql<boolean>`${playlist.userId} = ${user.id}`,
      role: playlistMember.role,
      isOwnerPremium: profile.isPremium,
    })
    .from(playlist)
    .innerJoin(profile, eq(profile.id, playlist.userId))
    .leftJoin(
      playlistMember,
      and(eq(playlistMember.playlistId, playlist.id), eq(playlistMember.userId, user.id)),
    )
    .where(eq(playlist.id, playlistId))
    .limit(1);

  if (!access) {
    throw new NotFoundException('Playlist not found');
  }

  if (access.isOwner) return 'owner';
  if (access.role) return access.isOwnerPremium ? access.role : 'viewer';
  return null;
}

// Throws unless `user` has one of `allowedRoles` in the playlist. An empty `allowedRoles` means
// any member (owner included). Returns the resolved role.
export async function assertPlaylistRole(
  db: DbTransaction | DrizzleService,
  user: User,
  playlistId: number,
  allowedRoles: PlaylistRole[],
): Promise<PlaylistRole> {
  const role = await getPlaylistRole(db, user, playlistId);

  if (!role) {
    throw new ForbiddenException('You must be a member of this playlist to perform this action.');
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    throw new ForbiddenException(`Access denied. Required roles: ${allowedRoles.join(', ')}`);
  }

  return role;
}

// Throws NotFoundException when the playlist does not exist or is not visible to `currentUser`,
// so a private playlist is indistinguishable from a missing one.
export async function assertPlaylistVisible(
  db: DbTransaction | DrizzleService,
  currentUser: User | null,
  playlistId: number,
): Promise<void> {
  const playlistRecord = await db.query.playlist.findFirst({
    where: and(eq(playlist.id, playlistId), canViewPlaylist(db, currentUser)),
    columns: { id: true },
  });

  if (!playlistRecord) {
    throw new NotFoundException('Playlist not found');
  }
}
