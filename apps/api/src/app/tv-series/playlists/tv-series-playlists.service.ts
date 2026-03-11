import { Inject, Injectable } from '@nestjs/common';
import { and, eq, exists, sql } from 'drizzle-orm';
import { playlist, playlistItem, profile, user } from '@libs/db/schemas';
import { User } from '../../auth/auth.service';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle/drizzle.module';
import { DbTransaction } from '@libs/db';
import { encodeCursor } from '../../../utils/cursor';
import { 
  ListInfinitePlaylistsQueryDto, 
  ListInfinitePlaylistsWithOwnerDto, 
  ListPaginatedPlaylistsQueryDto, 
  ListPaginatedPlaylistsWithOwnerDto 
} from '../../playlists/dto/playlists.dto';
import { plainToInstance } from 'class-transformer';
import { PlaylistQueryBuilder } from '../../playlists/playlists.query-builder';
import { USER_COMPACT_SELECT } from '@libs/db/selectors';

@Injectable()
export class TvSeriesPlaylistsService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  private getListBaseWhereClause(
    tx: DbTransaction,
    tvSeriesId: number,
    currentUser: User | null,
  ) {
    const visibilityCondition = PlaylistQueryBuilder.getVisibilityCondition(tx, currentUser);

    const containsTvSeriesCondition = exists(
      tx.select({ id: playlistItem.id })
        .from(playlistItem)
        .where(
          and(
            eq(playlistItem.playlistId, playlist.id),
            eq(playlistItem.tvSeriesId, tvSeriesId),
            eq(playlistItem.type, 'tv_series')
          )
        )
    );

    return and(
      containsTvSeriesCondition,
      visibilityCondition
    );
  }

  async listPaginated({
    tvSeriesId,
    query,
    currentUser,
  }: {
    tvSeriesId: number;
    query: ListPaginatedPlaylistsQueryDto;
    currentUser: User | null;
  }): Promise<ListPaginatedPlaylistsWithOwnerDto> {
    return await this.db.transaction(async (tx) => {
      const { per_page, page, sort_by, sort_order } = query;
      const offset = (page - 1) * per_page;

      const baseWhereClause = this.getListBaseWhereClause(tx, tvSeriesId, currentUser);
      const orderBy = PlaylistQueryBuilder.getOrderBy(sort_by, sort_order);
      const roleSelection = PlaylistQueryBuilder.getRoleSelection(currentUser);

      const [rows, totalCountResult] = await Promise.all([
        tx.select({
            playlist: playlist,
            role: roleSelection,
            owner: USER_COMPACT_SELECT,
          })
          .from(playlist)
          .innerJoin(user, eq(user.id, playlist.userId))
          .innerJoin(profile, eq(profile.id, user.id))
          .where(baseWhereClause)
          .orderBy(...orderBy)
          .limit(per_page)
          .offset(offset),
        tx.select({ count: sql<number>`count(*)` })
          .from(playlist)
          .where(baseWhereClause)
      ]);
    
      const totalCount = Number(totalCountResult[0]?.count || 0);

      return plainToInstance(ListPaginatedPlaylistsWithOwnerDto, {
        data: rows.map((row) => ({
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
    });
  }

  async listInfinite({
    tvSeriesId,
    query,
    currentUser,
  }: {
    tvSeriesId: number;
    query: ListInfinitePlaylistsQueryDto;
    currentUser: User | null;
  }): Promise<ListInfinitePlaylistsWithOwnerDto> {
    return await this.db.transaction(async (tx) => {
      const { per_page, sort_order, sort_by, cursor } = query;

      const baseWhereClause = this.getListBaseWhereClause(tx, tvSeriesId, currentUser);
      const orderBy = PlaylistQueryBuilder.getOrderBy(sort_by, sort_order);
      const roleSelection = PlaylistQueryBuilder.getRoleSelection(currentUser);
      
      const cursorWhereClause = PlaylistQueryBuilder.getCursorWhereClause(sort_by, sort_order, cursor);
      const finalWhereClause = cursorWhereClause 
        ? and(baseWhereClause, cursorWhereClause) 
        : baseWhereClause;

      const fetchLimit = per_page + 1;

      const results = await tx
        .select({
          playlist: playlist,
          role: roleSelection,
          owner: USER_COMPACT_SELECT,
        })
        .from(playlist)
        .innerJoin(user, eq(user.id, playlist.userId))
        .innerJoin(profile, eq(profile.id, user.id))
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

      return plainToInstance(ListInfinitePlaylistsWithOwnerDto, {
        data: paginatedResults.map((row) => ({
          ...row.playlist,
          role: row.role,
          owner: row.owner,
        })),
        meta: {
          next_cursor: nextCursor,
          per_page,
        },
      });
    });
  }
}