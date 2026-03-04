import { SQL, and, eq, exists, or } from 'drizzle-orm';
import { follow, playlist, playlistMember } from '@libs/db/schemas';
import { DbTransaction } from '@libs/db';
import { User } from '../auth/auth.service';
import { DrizzleService } from '../../common/modules/drizzle/drizzle.module';

export function canViewPlaylist(db: DbTransaction | DrizzleService, currentUser: User | null): SQL {
  if (!currentUser) {
    return eq(playlist.visibility, 'public');
  }

  const isMemberQuery = db
    .select({ id: playlistMember.id })
    .from(playlistMember)
    .where(
      and(
        eq(playlistMember.playlistId, playlist.id),
        eq(playlistMember.userId, currentUser.id)
      )
    );

  const isFollowerQuery = db
    .select({ followingId: follow.followingId })
    .from(follow)
    .where(
      and(
        eq(follow.followerId, currentUser.id),
        eq(follow.followingId, playlist.userId),
        eq(follow.status, 'accepted')
      )
    );

  return or(
    eq(playlist.visibility, 'public'),
    eq(playlist.userId, currentUser.id),
    exists(isMemberQuery),
    and(
      eq(playlist.visibility, 'followers'),
      exists(isFollowerQuery)
    )
  );
}