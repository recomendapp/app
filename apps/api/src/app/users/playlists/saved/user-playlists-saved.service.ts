import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, gt, lt, or, SQL, sql } from 'drizzle-orm';
import { playlist, playlistSaved, profile, user } from '@libs/db/schemas'; // 🔥 Ajout de profile et user
import { User } from '../../../auth/auth.service';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../../common/modules/drizzle/drizzle.module';
import { ListInfinitePlaylistsWithOwnerDto, ListPaginatedPlaylistsWithOwnerDto } from '../../../playlists/dto/playlists.dto';
import { SortOrder } from '../../../../common/dto/sort.dto';
import { BaseCursor, decodeCursor, encodeCursor } from '../../../../utils/cursor';
import { plainToInstance } from 'class-transformer';
import { PlaylistQueryBuilder } from '../../../playlists/playlists.query-builder';
import { ListInfinitePlaylistsSavedQueryDto, ListPaginatedPlaylistsSavedQueryDto, PlaylistSavedSortBy } from '../../../playlists/saves/dto/playlist-saved.dto';
import { USER_COMPACT_SELECT } from '@libs/db/selectors';

@Injectable()
export class UserPlaylistsSavedService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  private getListBaseWhereClause(
    targetUserId: string,
    currentUser: User | null,
  ) {
    const visibilityCondition = PlaylistQueryBuilder.getVisibilityCondition(this.db, currentUser);

    return and(
      eq(playlistSaved.userId, targetUserId),
      visibilityCondition
    );
  }

  private getOrderBy(sortBy: PlaylistSavedSortBy, sortOrder: SortOrder) {
    const direction = sortOrder === SortOrder.ASC ? asc : desc;
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
  }

  private getCursorWhereClause(sortBy: PlaylistSavedSortBy, sortOrder: SortOrder, cursor?: string): SQL | undefined {
    const cursorData = cursor ? decodeCursor<BaseCursor<string | number, number>>(cursor) : null;
    if (!cursorData) return undefined;

    const operator = sortOrder === SortOrder.ASC ? gt : lt;

    switch (sortBy) {
      case PlaylistSavedSortBy.LIKES_COUNT:
        return or(operator(playlist.likesCount, Number(cursorData.value)), and(eq(playlist.likesCount, Number(cursorData.value)), operator(playlistSaved.id, cursorData.id)));
      case PlaylistSavedSortBy.UPDATED_AT:
        return or(operator(playlist.updatedAt, String(cursorData.value)), and(eq(playlist.updatedAt, String(cursorData.value)), operator(playlistSaved.id, cursorData.id)));
      case PlaylistSavedSortBy.RANDOM: return undefined;
      case PlaylistSavedSortBy.SAVED_AT:
      default:
        return or(operator(playlistSaved.createdAt, String(cursorData.value)), and(eq(playlistSaved.createdAt, String(cursorData.value)), operator(playlistSaved.id, cursorData.id)));
    }
  }

  async listPaginated({
    targetUserId,
    query,
    currentUser,
  }: {
    targetUserId: string,
    query: ListPaginatedPlaylistsSavedQueryDto,
    currentUser: User | null
  }): Promise<ListPaginatedPlaylistsWithOwnerDto> {
    const { per_page, sort_order, sort_by, page } = query;
    const offset = (page - 1) * per_page;

    const baseWhereClause = this.getListBaseWhereClause(targetUserId, currentUser);
    const orderBy = this.getOrderBy(sort_by, sort_order);
    const roleSelection = PlaylistQueryBuilder.getRoleSelection(currentUser);

    const [results, [{ count: totalCount }]] = await Promise.all([
      this.db
        .select({ 
          playlist: playlist,
          role: roleSelection,
          owner: USER_COMPACT_SELECT,
        })
        .from(playlistSaved)
        .innerJoin(playlist, eq(playlist.id, playlistSaved.playlistId))
        .innerJoin(user, eq(user.id, playlist.userId))
        .innerJoin(profile, eq(profile.id, user.id))
        .where(baseWhereClause)
        .orderBy(...orderBy)
        .limit(per_page)
        .offset(offset),
      this.db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(playlistSaved)
        .innerJoin(playlist, eq(playlist.id, playlistSaved.playlistId))
        .where(baseWhereClause),
    ]);

    return plainToInstance(ListPaginatedPlaylistsWithOwnerDto, {
      data: results.map(row => ({
        ...row.playlist,
        role: row.role,
        owner: row.owner,
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
    query: ListInfinitePlaylistsSavedQueryDto,
    currentUser: User | null
  }): Promise<ListInfinitePlaylistsWithOwnerDto> {
    const { per_page, sort_order, sort_by, cursor } = query;

    const baseWhereClause = this.getListBaseWhereClause(targetUserId, currentUser);
    const orderBy = this.getOrderBy(sort_by, sort_order);
    const roleSelection = PlaylistQueryBuilder.getRoleSelection(currentUser);

    const cursorWhereClause = this.getCursorWhereClause(sort_by, sort_order, cursor);
    const finalWhereClause = cursorWhereClause 
      ? and(baseWhereClause, cursorWhereClause) 
      : baseWhereClause;

    const fetchLimit = per_page + 1;

    const results = await this.db
      .select({ 
        playlist: playlist, 
        role: roleSelection,
        owner: USER_COMPACT_SELECT,
        savedId: playlistSaved.id,
        savedAt: playlistSaved.createdAt 
      })
      .from(playlistSaved)
      .innerJoin(playlist, eq(playlist.id, playlistSaved.playlistId))
      .innerJoin(user, eq(user.id, playlist.userId))
      .innerJoin(profile, eq(profile.id, user.id))
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

    return plainToInstance(ListInfinitePlaylistsWithOwnerDto, {
      data: paginatedResults.map(r => ({
        ...r.playlist,
        role: r.role,
        owner: r.owner,
      })),
      meta: {
        next_cursor: nextCursor,
        per_page,
      },
    });
  }
}