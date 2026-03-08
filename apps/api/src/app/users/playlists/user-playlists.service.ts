import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { follow, playlist } from '@libs/db/schemas';
import { User } from '../../auth/auth.service';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle/drizzle.module';
import { ListPaginatedPlaylistsQueryDto, ListPaginatedPlaylistsDto, ListInfinitePlaylistsQueryDto, ListInfinitePlaylistsDto } from '../../playlists/dto/playlists.dto';
import { encodeCursor } from '../../../utils/cursor';
import { plainToInstance } from 'class-transformer';
import { PlaylistQueryBuilder } from '../../playlists/playlists.query-builder';

@Injectable()
export class UserPlaylistsService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  private async getIsFollowing(targetUserId: string, currentUser: User | null): Promise<boolean> {
    if (!currentUser || currentUser.id === targetUserId) return false;
    
    const followRecord = await this.db.query.follow.findFirst({
      where: and(
        eq(follow.followerId, currentUser.id),
        eq(follow.followingId, targetUserId),
        eq(follow.status, 'accepted')
      ),
      columns: { followerId: true }
    });
    return !!followRecord;
  }

  async listPaginated({
    targetUserId,
    query,
    currentUser,
  }: {
    targetUserId: string,
    query: ListPaginatedPlaylistsQueryDto,
    currentUser: User | null
  }): Promise<ListPaginatedPlaylistsDto> {
    const { per_page, sort_order, sort_by, page } = query;
    const offset = (page - 1) * per_page;

    const isFollowing = await this.getIsFollowing(targetUserId, currentUser);
    
    const visibilityCondition = PlaylistQueryBuilder.getVisibilityCondition(this.db, currentUser, {
      targetUserId,
      isFollowingTarget: isFollowing
    });
    const orderBy = PlaylistQueryBuilder.getOrderBy(sort_by, sort_order);
    const roleSelection = PlaylistQueryBuilder.getRoleSelection(currentUser);

    const whereClause = and(eq(playlist.userId, targetUserId), visibilityCondition);

    const [results, totalCount] = await Promise.all([
      this.db
        .select({
          playlist: playlist,
          role: roleSelection,
        })
        .from(playlist)
        .where(whereClause)
        .orderBy(...orderBy)
        .limit(per_page)
        .offset(offset),
      this.db.$count(playlist, whereClause),
    ]);

    return plainToInstance(ListPaginatedPlaylistsDto, {
      data: results.map(row => ({
        ...row.playlist,
        role: row.role,
      })),
      meta: {
        total_results: totalCount,
        total_pages: Math.ceil(totalCount / per_page),
        current_page: page,
        per_page,
      },
    });
  }

  async listInfinite({
    targetUserId,
    query,
    currentUser,
  }: {
    targetUserId: string,
    query: ListInfinitePlaylistsQueryDto,
    currentUser: User | null
  }): Promise<ListInfinitePlaylistsDto> {
    const { per_page, sort_order, sort_by, cursor } = query;

    const isFollowing = await this.getIsFollowing(targetUserId, currentUser);

    const visibilityCondition = PlaylistQueryBuilder.getVisibilityCondition(this.db, currentUser, {
      targetUserId,
      isFollowingTarget: isFollowing
    });
    const orderBy = PlaylistQueryBuilder.getOrderBy(sort_by, sort_order);
    const roleSelection = PlaylistQueryBuilder.getRoleSelection(currentUser);
    const cursorWhereClause = PlaylistQueryBuilder.getCursorWhereClause(sort_by, sort_order, cursor);

    const baseWhereClause = and(eq(playlist.userId, targetUserId), visibilityCondition);
    const finalWhereClause = cursorWhereClause 
      ? and(baseWhereClause, cursorWhereClause) 
      : baseWhereClause;

    const fetchLimit = per_page + 1;

    const results = await this.db
      .select({
        playlist: playlist,
        role: roleSelection,
      })
      .from(playlist)
      .where(finalWhereClause)
      .orderBy(...orderBy)
      .limit(fetchLimit);

    const hasNextPage = results.length > per_page;
    const paginatedResults = hasNextPage ? results.slice(0, per_page) : results;

    let nextCursor: string | null = null;

    if (hasNextPage) {
      const lastItem = paginatedResults[paginatedResults.length - 1].playlist;
      const cursorValue = PlaylistQueryBuilder.getNextCursorValue(lastItem, sort_by);
      
      if (cursorValue !== null) {
        nextCursor = encodeCursor({
          value: cursorValue,
          id: lastItem.id,
        });
      }
    }

    return plainToInstance(ListInfinitePlaylistsDto, {
      data: paginatedResults.map(row => ({
        ...row.playlist,
        role: row.role,
      })),
      meta: {
        next_cursor: nextCursor,
        per_page,
      },
    });
  }
}