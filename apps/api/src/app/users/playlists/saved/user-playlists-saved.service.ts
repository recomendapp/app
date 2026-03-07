import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, gt, lt, or, SQL, sql } from 'drizzle-orm';
import { playlist, playlistSaved } from '@libs/db/schemas';
import { User } from '../../../auth/auth.service';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../../common/modules/drizzle/drizzle.module';
import { ListPaginatedPlaylistsDto, ListInfinitePlaylistsDto } from '../../../playlists/dto/playlists.dto';
import { SortOrder } from '../../../../common/dto/sort.dto';
import { BaseCursor, decodeCursor, encodeCursor } from '../../../../utils/cursor';
import { plainToInstance } from 'class-transformer';
import { canViewPlaylist } from '../../../playlists/playlists.permission';
import { ListInfinitePlaylistsSavedQueryDto, ListPaginatedPlaylistsSavedQueryDto, PlaylistSavedSortBy } from '../../../playlists/saves/dto/playlist-saved.dto';

@Injectable()
export class UserPlaylistsSavedService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  private getListBaseQuery(
    targetUserId: string,
    currentUser: User | null,
    sortBy: PlaylistSavedSortBy,
    sortOrder: SortOrder,
  ) {
    const direction = sortOrder === SortOrder.ASC ? asc : desc;
    
    const orderBy = (() => {
      switch (sortBy) {
        case PlaylistSavedSortBy.RANDOM:
          return [sql`RANDOM()`];
        case PlaylistSavedSortBy.LIKES_COUNT:
          return [direction(playlist.likesCount), direction(playlistSaved.id)];
        case PlaylistSavedSortBy.UPDATED_AT:
          return [direction(playlist.updatedAt), direction(playlistSaved.id)];
        case PlaylistSavedSortBy.SAVED_AT:
        default:
          return [direction(playlistSaved.createdAt), direction(playlistSaved.id)];
      }
    })();

    const whereClause = and(
      eq(playlistSaved.userId, targetUserId),
      canViewPlaylist(this.db, currentUser),
    );

    return { whereClause, orderBy };
  }

  async listPaginated({
    targetUserId,
    query,
    currentUser,
  }: {
    targetUserId: string,
    query: ListPaginatedPlaylistsSavedQueryDto,
    currentUser: User | null
  }): Promise<ListPaginatedPlaylistsDto> {
    const { per_page, sort_order, sort_by, page } = query;
    const offset = (page - 1) * per_page;

    const { whereClause, orderBy } = this.getListBaseQuery(targetUserId, currentUser, sort_by, sort_order);

    const [results, [{ count: totalCount }]] = await Promise.all([
      this.db
        .select({ playlist })
        .from(playlistSaved)
        .innerJoin(playlist, eq(playlist.id, playlistSaved.playlistId))
        .where(whereClause)
        .orderBy(...orderBy)
        .limit(per_page)
        .offset(offset),
      this.db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(playlistSaved)
        .innerJoin(playlist, eq(playlist.id, playlistSaved.playlistId))
        .where(whereClause),
    ]);

    return plainToInstance(ListPaginatedPlaylistsDto, {
      data: results.map(row => row.playlist),
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
    query: ListInfinitePlaylistsSavedQueryDto,
    currentUser: User | null
  }): Promise<ListInfinitePlaylistsDto> {
    const { per_page, sort_order, sort_by, cursor } = query;

    const cursorData = cursor ? decodeCursor<BaseCursor<string | number, number>>(cursor) : null;

    const { whereClause: baseWhereClause, orderBy } = this.getListBaseQuery(targetUserId, currentUser, sort_by, sort_order);

    let cursorWhereClause: SQL | undefined;

    if (cursorData) {
      const operator = sort_order === SortOrder.ASC ? gt : lt;

      switch (sort_by) {
        case PlaylistSavedSortBy.LIKES_COUNT: {
          cursorWhereClause = or(
            operator(playlist.likesCount, Number(cursorData.value)),
            and(
              eq(playlist.likesCount, Number(cursorData.value)),
              operator(playlistSaved.id, cursorData.id)
            )
          );
          break;
        }

        case PlaylistSavedSortBy.UPDATED_AT: {
          const updatedDate = String(cursorData.value);
          cursorWhereClause = or(
            operator(playlist.updatedAt, updatedDate),
            and(
              eq(playlist.updatedAt, updatedDate),
              operator(playlistSaved.id, cursorData.id)
            )
          );
          break;
        }

        case PlaylistSavedSortBy.RANDOM:
          break;

        case PlaylistSavedSortBy.SAVED_AT:
        default: {
          const savedDate = String(cursorData.value);
          cursorWhereClause = or(
            operator(playlistSaved.createdAt, savedDate),
            and(
              eq(playlistSaved.createdAt, savedDate),
              operator(playlistSaved.id, cursorData.id)
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
      .select({ 
        playlist: playlist, 
        savedId: playlistSaved.id,
        savedAt: playlistSaved.createdAt 
      })
      .from(playlistSaved)
      .innerJoin(playlist, eq(playlist.id, playlistSaved.playlistId))
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
        case PlaylistSavedSortBy.LIKES_COUNT:
          cursorValue = lastItem.playlist.likesCount ?? 0;
          break;
        case PlaylistSavedSortBy.UPDATED_AT:
          cursorValue = lastItem.playlist.updatedAt;
          break;
        case PlaylistSavedSortBy.SAVED_AT:
        default:
          cursorValue = lastItem.savedAt;
          break;
      }

      if (cursorValue !== null) {
        nextCursor = encodeCursor<BaseCursor<string | number, number>>({
          value: cursorValue,
          id: lastItem.savedId,
        });
      }
    }

    return plainToInstance(ListInfinitePlaylistsDto, {
      data: paginatedResults.map(r => r.playlist),
      meta: {
        next_cursor: nextCursor,
        per_page,
      },
    });
  }
}