import { Inject, Injectable } from '@nestjs/common';
import { and, eq, exists, ilike, sql } from 'drizzle-orm';
import { User } from '../../../auth/auth.service';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../../common/modules/drizzle/drizzle.module';
import { playlist, playlistItem } from '@libs/db/schemas';
import { SortOrder } from '../../../../common/dto/sort.dto';
import { BaseCursor, decodeCursor, encodeCursor } from '../../../../utils/cursor';
import { plainToInstance } from 'class-transformer';
import { PlaylistQueryBuilder } from '../../playlists.query-builder';
import { PlaylistSortBy } from '../../dto/playlists.dto';
import { 
  ListAllPlaylistsAddTargetsQueryDto, 
  ListInfinitePlaylistsAddTargetsDto, 
  ListInfinitePlaylistsAddTargetsQueryDto, 
  ListPaginatedPlaylistsAddTargetsDto, 
  ListPaginatedPlaylistsAddTargetsQueryDto, 
  PlaylistsAddTargetDto 
} from './playlists-add-targets.dto';

@Injectable()
export class PlaylistsAddTargetsService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  private getListBaseQuery(
    currentUser: User,
    type: 'movie' | 'tv_series',
    mediaId: number,
    sortBy: PlaylistSortBy,
    sortOrder: SortOrder,
    search?: string,
  ) {
    const orderBy = PlaylistQueryBuilder.getOrderBy(sortBy, sortOrder);

    const whereClause = and(
      eq(playlist.userId, currentUser.id),
      search ? ilike(playlist.title, `%${search}%`) : undefined
    );

    const isAlreadyAdded = exists(
      this.db.select({ id: playlistItem.id })
        .from(playlistItem)
        .where(and(
          eq(playlistItem.playlistId, playlist.id),
          eq(playlistItem.type, type),
          type === 'movie' 
            ? eq(playlistItem.movieId, mediaId) 
            : eq(playlistItem.tvSeriesId, mediaId)
        ))
    ).as('alreadyAdded');

    const joinedQb = this.db
      .select({
        playlist: playlist,
        role: sql<string>`'owner'`,
        alreadyAdded: isAlreadyAdded,
      })
      .from(playlist);

    return { joinedQb, whereClause, orderBy };
  }

  async listAll({
    currentUser,
    type,
    mediaId,
    query,
  }: {
    currentUser: User;
    type: 'movie' | 'tv_series';
    mediaId: number;
    query: ListAllPlaylistsAddTargetsQueryDto;
  }): Promise<PlaylistsAddTargetDto[]> {
    const { sort_order, sort_by, search } = query;
    const { joinedQb, whereClause, orderBy } = this.getListBaseQuery(currentUser, type, mediaId, sort_by, sort_order, search);

    const results = await joinedQb.where(whereClause).orderBy(...orderBy);

    return plainToInstance(PlaylistsAddTargetDto, results.map(row => ({
      ...row.playlist,
      role: row.role,
      alreadyAdded: row.alreadyAdded,
    })));
  }

  async listPaginated({
    currentUser,
    type,
    mediaId,
    query,
  }: {
    currentUser: User;
    type: 'movie' | 'tv_series';
    mediaId: number;
    query: ListPaginatedPlaylistsAddTargetsQueryDto;
  }): Promise<ListPaginatedPlaylistsAddTargetsDto> {
    const { per_page, sort_order, sort_by, page, search } = query;
    const offset = (page - 1) * per_page;

    const { joinedQb, whereClause, orderBy } = this.getListBaseQuery(currentUser, type, mediaId, sort_by, sort_order, search);

    const [results, totalCount] = await Promise.all([
      joinedQb
        .where(whereClause)
        .orderBy(...orderBy)
        .limit(per_page)
        .offset(offset),
      this.db.$count(playlist, whereClause)
    ]);

    return plainToInstance(ListPaginatedPlaylistsAddTargetsDto, {
      data: results.map(row => ({
        ...row.playlist,
        role: row.role,
        alreadyAdded: row.alreadyAdded,
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
    currentUser,
    type,
    mediaId,
    query,
  }: {
    currentUser: User;
    type: 'movie' | 'tv_series';
    mediaId: number;
    query: ListInfinitePlaylistsAddTargetsQueryDto;
  }): Promise<ListInfinitePlaylistsAddTargetsDto> {
    const { per_page, sort_order, sort_by, cursor, search, include_total_count } = query;
    const cursorData = cursor ? decodeCursor<BaseCursor<string | number, number>>(cursor) : null;

    const { joinedQb, whereClause: baseWhereClause, orderBy } = this.getListBaseQuery(currentUser, type, mediaId, sort_by, sort_order, search);
    const cursorWhereClause = PlaylistQueryBuilder.getCursorWhereClause(sort_by, sort_order, cursor);

    const finalWhereClause = cursorWhereClause 
      ? and(baseWhereClause, cursorWhereClause) 
      : baseWhereClause;

    const fetchLimit = per_page + 1;

    const [results, totalCount] = await Promise.all([
      joinedQb
        .where(finalWhereClause)
        .orderBy(...orderBy)
        .limit(fetchLimit),
      (!cursorData && include_total_count) 
        ? this.db.$count(playlist, baseWhereClause)
        : Promise.resolve(undefined)
    ]);

    const hasNextPage = results.length > per_page;
    const paginatedResults = hasNextPage ? results.slice(0, per_page) : results;

    let nextCursor: string | null = null;

    if (hasNextPage) {
      const lastItem = paginatedResults[paginatedResults.length - 1].playlist;
      const cursorValue = PlaylistQueryBuilder.getNextCursorValue(lastItem, sort_by);

      if (cursorValue !== null) {
        nextCursor = encodeCursor<BaseCursor<string | number, number>>({
          value: cursorValue,
          id: lastItem.id,
        });
      }
    }

    return plainToInstance(ListInfinitePlaylistsAddTargetsDto, {
      data: paginatedResults.map(row => ({
        ...row.playlist,
        role: row.role,
        alreadyAdded: row.alreadyAdded,
      })),
      meta: {
        next_cursor: nextCursor,
        per_page,
        total_results: totalCount,
      },
    });
  }
}