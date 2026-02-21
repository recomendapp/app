import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, exists, gt, lt, or, SQL, sql } from 'drizzle-orm';
import { follow, playlist, playlistMember } from '@libs/db/schemas';
import { User } from '../../auth/auth.service';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle.module';
import { ListPlaylistsQueryDto, ListPlaylistsDto, PlaylistSortBy, ListInfinitePlaylistsQueryDto, ListInfinitePlaylistsDto } from '../../playlists/dto/playlists.dto';
import { SortOrder } from '../../../common/dto/sort.dto';
import { BaseCursor, decodeCursor, encodeCursor } from '../../../utils/cursor';

@Injectable()
export class UserPlaylistsService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  private getListBaseQuery(
    targetUserId: string,
    currentUser: User | null,
    sortBy: PlaylistSortBy,
    sortOrder: SortOrder,
  ) {
    const direction = sortOrder === SortOrder.ASC ? asc : desc;
    const orderBy = (() => {
      switch (sortBy) {
        case PlaylistSortBy.RANDOM:
          return [sql`RANDOM()`];
        case PlaylistSortBy.LIKES_COUNT:
          return [direction(playlist.likesCount), direction(playlist.id)];
        case PlaylistSortBy.UPDATED_AT:
          return [direction(playlist.updatedAt), direction(playlist.id)];
        case PlaylistSortBy.CREATED_AT:
        default:
          return [direction(playlist.createdAt), direction(playlist.id)];
      }
    })();

    let whereClause: SQL | undefined;

    if (currentUser?.id === targetUserId) { 
      whereClause = eq(playlist.userId, targetUserId);
    } else if (!currentUser) { 
      whereClause = and(
        eq(playlist.userId, targetUserId),
        eq(playlist.visibility, 'public'),
      );
    } else { 
      const isFollowingSubquery = this.db
        .select({ is_following: sql<boolean>`true` })
        .from(follow)
        .where(
          and(
            eq(follow.followerId, currentUser.id),
            eq(follow.followingId, targetUserId),
            eq(follow.status, 'accepted')
          )
        )
        .limit(1);

      whereClause = and(
        eq(playlist.userId, targetUserId),
        or(
          eq(playlist.visibility, 'public'),
          and(
            eq(playlist.visibility, 'followers'),
            exists(isFollowingSubquery)
          ),
          exists(
            this.db.select({ id: playlistMember.id }).from(playlistMember).where(
              and(
                eq(playlistMember.playlistId, playlist.id),
                eq(playlistMember.userId, currentUser.id)
              )
            )
          )
        )
      );
    }

    return { whereClause, orderBy };
  }
  async list({
    targetUserId,
    query,
    currentUser,
  }: {
    targetUserId: string,
    query: ListPlaylistsQueryDto,
    currentUser: User | null
  }): Promise<ListPlaylistsDto> {
    const { per_page, sort_order, sort_by, page } = query;
    const offset = (page - 1) * per_page;

    const { whereClause, orderBy } = this.getListBaseQuery(
      targetUserId,
      currentUser,
      sort_by,
      sort_order
    );

    const [playlists, totalCount] = await Promise.all([
      this.db
        .select()
        .from(playlist)
        .where(whereClause)
        .orderBy(...orderBy)
        .limit(per_page)
        .offset(offset),
      this.db.$count(playlist, whereClause),
    ]);

    return {
      data: playlists,
      meta: {
        total_results: totalCount,
        total_pages: Math.ceil(totalCount / per_page),
        current_page: page,
        per_page,
      },
    };
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

    const cursorData = cursor ? decodeCursor<BaseCursor<string | number, number>>(cursor) : null;

    const { whereClause: baseWhereClause, orderBy } = this.getListBaseQuery(
      targetUserId,
      currentUser,
      sort_by,
      sort_order
    );

    let cursorWhereClause: SQL | undefined;

    if (cursorData) {
      const operator = sort_order === SortOrder.ASC ? gt : lt;

      switch (sort_by) {
        case PlaylistSortBy.LIKES_COUNT: {
          cursorWhereClause = or(
            operator(playlist.likesCount, Number(cursorData.value)),
            and(
              eq(playlist.likesCount, Number(cursorData.value)),
              operator(playlist.id, cursorData.id)
            )
          );
          break;
        }

        case PlaylistSortBy.UPDATED_AT: {
          const updatedDate = new Date(cursorData.value as string);
          cursorWhereClause = or(
            operator(playlist.updatedAt, updatedDate),
            and(
              eq(playlist.updatedAt, updatedDate),
              operator(playlist.id, cursorData.id)
            )
          );
          break;
        }

        case PlaylistSortBy.RANDOM:
          break;

        case PlaylistSortBy.CREATED_AT:
        default: {
          const createdDate = new Date(cursorData.value as string);
          cursorWhereClause = or(
            operator(playlist.createdAt, createdDate),
            and(
              eq(playlist.createdAt, createdDate),
              operator(playlist.id, cursorData.id)
            )
          );
          break;
        }
      }
    }

    const finalWhereClause = cursorWhereClause 
      ? and(baseWhereClause, cursorWhereClause) 
      : baseWhereClause;

    const fetchLimit = per_page + 1;

    const results = await this.db
      .select()
      .from(playlist)
      .where(finalWhereClause)
      .orderBy(...orderBy)
      .limit(fetchLimit);

    const hasNextPage = results.length > per_page;
    const paginatedResults = hasNextPage ? results.slice(0, per_page) : results;

    let nextCursor: string | null = null;

    if (hasNextPage) {
      const lastItem = paginatedResults[paginatedResults.length - 1];
      let cursorValue: string | number | null = null;

      switch (sort_by) {
        case PlaylistSortBy.LIKES_COUNT:
          cursorValue = lastItem.likesCount ?? 0;
          break;
        case PlaylistSortBy.UPDATED_AT:
          cursorValue = lastItem.updatedAt.toISOString();
          break;
        case PlaylistSortBy.CREATED_AT:
        default:
          cursorValue = lastItem.createdAt.toISOString();
          break;
      }

      if (cursorValue !== null) {
        nextCursor = encodeCursor<BaseCursor<string | number, number>>({
          value: cursorValue,
          id: lastItem.id,
        });
      }
    }

    return {
      data: paginatedResults,
      meta: {
        next_cursor: nextCursor,
        per_page,
      },
    };
  }
}
