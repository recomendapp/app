import { and, asc, desc, eq, exists, gt, lt, or, SQL, sql } from 'drizzle-orm';
import { follow, playlist, playlistMember, profile } from '@libs/db/schemas';
import { SortOrder } from '../../common/dto/sort.dto';
import { PlaylistSortBy } from './dto/playlists.dto';
import { BaseCursor, decodeCursor } from '../../utils/cursor';
import { User } from '../auth/auth.service';
import { DbTransaction } from '@libs/db';
import { DrizzleService } from '../../common/modules/drizzle/drizzle.module';
import { PlaylistRole } from './types/playlist-role.type';

export class PlaylistQueryBuilder {
  static getOrderBy(sortBy: PlaylistSortBy, sortOrder: SortOrder) {
    const direction = sortOrder === SortOrder.ASC ? asc : desc;
    switch (sortBy) {
      case PlaylistSortBy.RANDOM: return [sql`RANDOM()`];
      case PlaylistSortBy.LIKES_COUNT: return [direction(playlist.likesCount), direction(playlist.id)];
      case PlaylistSortBy.UPDATED_AT: return [direction(playlist.updatedAt), direction(playlist.id)];
      case PlaylistSortBy.CREATED_AT:
      default: return [direction(playlist.createdAt), direction(playlist.id)];
    }
  }

  static getCursorWhereClause(sortBy: PlaylistSortBy, sortOrder: SortOrder, cursor?: string): SQL | undefined {
    const cursorData = cursor ? decodeCursor<BaseCursor<string | number, number>>(cursor) : null;
    if (!cursorData) return undefined;

    const operator = sortOrder === SortOrder.ASC ? gt : lt;
    switch (sortBy) {
      case PlaylistSortBy.LIKES_COUNT:
        return or(operator(playlist.likesCount, Number(cursorData.value)), and(eq(playlist.likesCount, Number(cursorData.value)), operator(playlist.id, cursorData.id)));
      case PlaylistSortBy.UPDATED_AT:
        return or(operator(playlist.updatedAt, String(cursorData.value)), and(eq(playlist.updatedAt, String(cursorData.value)), operator(playlist.id, cursorData.id)));
      case PlaylistSortBy.RANDOM: return undefined;
      case PlaylistSortBy.CREATED_AT:
      default:
        return or(operator(playlist.createdAt, String(cursorData.value)), and(eq(playlist.createdAt, String(cursorData.value)), operator(playlist.id, cursorData.id)));
    }
  }

  static getNextCursorValue(lastItem: typeof playlist.$inferSelect, sortBy: PlaylistSortBy): string | number {
    switch (sortBy) {
      case PlaylistSortBy.LIKES_COUNT: return lastItem.likesCount ?? 0;
      case PlaylistSortBy.UPDATED_AT: return lastItem.updatedAt;
      case PlaylistSortBy.CREATED_AT:
      default: return lastItem.createdAt;
    }
  }

  static getVisibilityCondition(
    db: DbTransaction | DrizzleService, 
    currentUser: User | null, 
    staticOwner?: { targetUserId: string; isFollowingTarget: boolean }
  ): SQL {
    if (!currentUser) return eq(playlist.visibility, 'public');

    const isMemberSubquery = db
      .select({ id: playlistMember.id })
      .from(playlistMember)
      .where(and(eq(playlistMember.playlistId, playlist.id), eq(playlistMember.userId, currentUser.id)))
      .limit(1);

    let followerLogic: SQL;
    if (staticOwner) {
      followerLogic = staticOwner.isFollowingTarget ? eq(playlist.visibility, 'followers') : sql<boolean>`false`;
    } else {
      const isFollowerSubquery = db
        .select({ followingId: follow.followingId })
        .from(follow)
        .where(and(eq(follow.followerId, currentUser.id), eq(follow.followingId, playlist.userId), eq(follow.status, 'accepted')))
        .limit(1);
      followerLogic = and(eq(playlist.visibility, 'followers'), exists(isFollowerSubquery));
    }

    return or(
      eq(playlist.visibility, 'public'),
      eq(playlist.userId, currentUser.id),
      followerLogic,
      exists(isMemberSubquery)
    );
  }

  static getRoleSelection(currentUser: User | null): SQL<PlaylistRole | null> {
    if (!currentUser) return sql<PlaylistRole | null>`NULL`;
    
    return sql<PlaylistRole | null>`
      CASE 
        WHEN ${playlist.userId} = ${currentUser.id} THEN 'owner'
        ELSE (
          SELECT 
            CASE 
              WHEN pr.is_premium = true THEN pm.role::text
              ELSE 'viewer'
            END
          FROM ${playlistMember} pm
          INNER JOIN ${profile} pr ON pr.id = "playlist"."user_id"
          WHERE pm.playlist_id = "playlist"."id"
          AND pm.user_id = ${currentUser.id}
          LIMIT 1
        )
      END
    `;
  }
}