import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, exists, gt, lt, or, SQL, sql } from 'drizzle-orm';
import { follow, playlist, profile, user } from '@libs/db/schemas';
import { User } from '../../../auth/auth.service';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../../common/modules/drizzle/drizzle.module';
import { 
  ListPaginatedPlaylistsQueryDto, 
  PlaylistSortBy, 
  ListInfinitePlaylistsQueryDto, 
  ListPaginatedPlaylistsWithOwnerDto,
  ListInfinitePlaylistsWithOwnerDto
} from '../../../playlists/dto/playlists.dto';
import { SortOrder } from '../../../../common/dto/sort.dto';
import { BaseCursor, decodeCursor, encodeCursor } from '../../../../utils/cursor';
import { plainToInstance } from 'class-transformer';
import { canViewPlaylist } from '../../../playlists/playlists.permission';
import { USER_COMPACT_SELECT } from '@libs/db/selectors';

@Injectable()
export class MePlaylistsFollowingService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  private getListBaseQuery(
    currentUser: User,
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

    const whereClause = and(
      exists(
        this.db.select({ id: follow.followerId })
          .from(follow)
          .where(
            and(
              eq(follow.followerId, currentUser.id),
              eq(follow.followingId, playlist.userId),
              eq(follow.status, 'accepted')
            )
          )
      ),
      canViewPlaylist(this.db, currentUser)
    );

    return { whereClause, orderBy };
  }
  async listPaginated({
    query,
    currentUser,
  }: {
    query: ListPaginatedPlaylistsQueryDto;
    currentUser: User;
  }): Promise<ListPaginatedPlaylistsWithOwnerDto> {
    const { per_page, sort_order, sort_by, page } = query;
    const offset = (page - 1) * per_page;

    const { whereClause, orderBy } = this.getListBaseQuery(currentUser, sort_by, sort_order);

    const [results, totalCount] = await Promise.all([
      this.db
        .select({
          playlist: playlist,
          owner: USER_COMPACT_SELECT,
        })
        .from(playlist)
        .innerJoin(user, eq(playlist.userId, user.id))
        .leftJoin(profile, eq(user.id, profile.id))
        .where(whereClause)
        .orderBy(...orderBy)
        .limit(per_page)
        .offset(offset),
      this.db.$count(playlist, whereClause),
    ]);

    return plainToInstance(ListPaginatedPlaylistsWithOwnerDto, {
      data: results.map(row => ({
        ...row.playlist,
        owner: row.owner,
      })),
      meta: {
        total_results: totalCount,
        total_pages: Math.ceil(totalCount / per_page),
        current_page: page,
        per_page,
      },
    }, { excludeExtraneousValues: true });
  }
  async listInfinite({
    query,
    currentUser,
  }: {
    query: ListInfinitePlaylistsQueryDto;
    currentUser: User;
  }): Promise<ListInfinitePlaylistsWithOwnerDto> {
    const { per_page, sort_order, sort_by, cursor, include_total_count } = query;

    const cursorData = cursor ? decodeCursor<BaseCursor<string | number, number>>(cursor) : null;

    const { whereClause: baseWhereClause, orderBy } = this.getListBaseQuery(currentUser, sort_by, sort_order);

    let cursorWhereClause: SQL | undefined;

    if (cursorData) {
      const operator = sort_order === SortOrder.ASC ? gt : lt;

      switch (sort_by) {
        case PlaylistSortBy.LIKES_COUNT:
          cursorWhereClause = or(
            operator(playlist.likesCount, Number(cursorData.value)),
            and(eq(playlist.likesCount, Number(cursorData.value)), operator(playlist.id, cursorData.id))
          );
          break;
        case PlaylistSortBy.UPDATED_AT:
          cursorWhereClause = or(
            operator(playlist.updatedAt, String(cursorData.value)),
            and(eq(playlist.updatedAt, String(cursorData.value)), operator(playlist.id, cursorData.id))
          );
          break;
        case PlaylistSortBy.RANDOM:
          break;
        case PlaylistSortBy.CREATED_AT:
        default:
          cursorWhereClause = or(
            operator(playlist.createdAt, String(cursorData.value)),
            and(eq(playlist.createdAt, String(cursorData.value)), operator(playlist.id, cursorData.id))
          );
          break;
      }
    }

    const finalWhereClause = cursorWhereClause ? and(baseWhereClause, cursorWhereClause) : baseWhereClause;
    const fetchLimit = per_page + 1;

    const [results, totalCountResult] = await Promise.all([
      this.db
        .select({
          playlist: playlist,
          owner: USER_COMPACT_SELECT,
        })
        .from(playlist)
        .innerJoin(user, eq(playlist.userId, user.id))
        .leftJoin(profile, eq(user.id, profile.id))
        .where(finalWhereClause)
        .orderBy(...orderBy)
        .limit(fetchLimit),
      (!cursorData && include_total_count)
        ? this.db.select({ count: sql<number>`cast(count(*) as int)` }).from(playlist).where(baseWhereClause)
        : Promise.resolve(undefined)
    ]);

    const totalCount = totalCountResult ? totalCountResult[0].count : undefined;
    const hasNextPage = results.length > per_page;
    const paginatedResults = hasNextPage ? results.slice(0, per_page) : results;

    let nextCursor: string | null = null;

    if (hasNextPage) {
      const lastItem = paginatedResults[paginatedResults.length - 1].playlist;
      let cursorValue: string | number | null = null;

      switch (sort_by) {
        case PlaylistSortBy.LIKES_COUNT: cursorValue = lastItem.likesCount ?? 0; break;
        case PlaylistSortBy.UPDATED_AT: cursorValue = lastItem.updatedAt; break;
        case PlaylistSortBy.CREATED_AT: default: cursorValue = lastItem.createdAt; break;
      }

      if (cursorValue !== null) {
        nextCursor = encodeCursor<BaseCursor<string | number, number>>({ value: cursorValue, id: lastItem.id });
      }
    }

    return plainToInstance(ListInfinitePlaylistsWithOwnerDto, {
      data: paginatedResults.map(row => ({
        ...row.playlist,
        owner: row.owner,
      })),
      meta: {
        next_cursor: nextCursor,
        per_page,
        total_results: totalCount,
      },
    }, { excludeExtraneousValues: true });
  }
}