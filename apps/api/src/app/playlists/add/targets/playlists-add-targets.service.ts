import { Inject, Injectable } from '@nestjs/common';
import { and, eq, exists, ilike, inArray, or, sql, SQL } from 'drizzle-orm';
import { User } from '../../../auth/auth.service';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../../common/modules/drizzle/drizzle.module';
import { playlist, playlistItem, playlistMember, playlistSaved, profile, user } from '@libs/db/schemas';
import { SortOrder } from '../../../../common/dto/sort.dto';
import { BaseCursor, decodeCursor, encodeCursor } from '../../../../utils/cursor';
import { plainToInstance } from 'class-transformer';
import { PlaylistQueryBuilder } from '../../playlists.query-builder';
import { PlaylistSortBy } from '../../dto/playlists.dto';
import { USER_COMPACT_SELECT } from '@libs/db/selectors';
import { 
  ListAllPlaylistsAddTargetsQueryDto, 
  ListInfinitePlaylistsAddTargetsDto, 
  ListInfinitePlaylistsAddTargetsQueryDto, 
  ListPaginatedPlaylistsAddTargetsDto, 
  ListPaginatedPlaylistsAddTargetsQueryDto, 
  PlaylistsAddTargetDto,
  PlaylistTargetFilter
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
    filter: PlaylistTargetFilter = PlaylistTargetFilter.ALL,
    search?: string,
  ) {
    const orderBy = PlaylistQueryBuilder.getOrderBy(sortBy, sortOrder);

    const hasEditRole = exists(
      this.db.select({ id: playlistMember.id })
        .from(playlistMember)
        .where(
          and(
            eq(playlistMember.playlistId, playlist.id),
            eq(playlistMember.userId, currentUser.id),
            inArray(playlistMember.role, ['editor', 'admin'])
          )
        )
    );

    const isOwnerPremium = exists(
      this.db.select({ id: profile.id })
        .from(profile)
        .where(
          and(
            eq(profile.id, playlist.userId),
            eq(profile.isPremium, true)
          )
        )
    );

    const canEditCondition = or(
      eq(playlist.userId, currentUser.id),
      and(hasEditRole, isOwnerPremium)
    );

    const savedPlaylistIdsSubquery = this.db.select({ id: playlistSaved.playlistId })
      .from(playlistSaved)
      .where(eq(playlistSaved.userId, currentUser.id));

    let filterClause: SQL;
    if (filter === PlaylistTargetFilter.MINE) {
      filterClause = eq(playlist.userId, currentUser.id);
    } else if (filter === PlaylistTargetFilter.SAVED) {
      filterClause = and(
        inArray(playlist.id, savedPlaylistIdsSubquery),
        canEditCondition,
        sql`${playlist.userId} != ${currentUser.id}`
      );
    } else { // ALL
      filterClause = or(
        eq(playlist.userId, currentUser.id),
        and(inArray(playlist.id, savedPlaylistIdsSubquery), canEditCondition)
      );
    }

    const whereClause = and(
      filterClause,
      search ? ilike(playlist.title, `%${search}%`) : undefined
    );

    const isAlreadyAdded = exists(
      this.db.select({ id: playlistItem.id })
        .from(playlistItem)
        .where(and(
          eq(playlistItem.playlistId, playlist.id),
          eq(playlistItem.type, type),
          type === 'movie' ? eq(playlistItem.movieId, mediaId) : eq(playlistItem.tvSeriesId, mediaId)
        ))
    ).as('alreadyAdded');

    const roleSelection = PlaylistQueryBuilder.getRoleSelection(currentUser);

    const joinedQb = this.db
      .select({
        playlist: playlist,
        role: roleSelection,
        owner: USER_COMPACT_SELECT,
        alreadyAdded: isAlreadyAdded,
      })
      .from(playlist)
      .innerJoin(user, eq(user.id, playlist.userId))
      .innerJoin(profile, eq(profile.id, user.id));

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
    const { sort_order, sort_by, search, filter } = query;
    const { joinedQb, whereClause, orderBy } = this.getListBaseQuery(currentUser, type, mediaId, sort_by, sort_order, filter, search);

    const results = await joinedQb.where(whereClause).orderBy(...orderBy);

    return plainToInstance(PlaylistsAddTargetDto, results.map(row => ({
      ...row.playlist,
      role: row.role,
      owner: row.owner,
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
    const { per_page, sort_order, sort_by, page, search, filter } = query;
    const offset = (page - 1) * per_page;

    const { joinedQb, whereClause, orderBy } = this.getListBaseQuery(currentUser, type, mediaId, sort_by, sort_order, filter, search);

    const [results, totalCount] = await Promise.all([
      joinedQb.where(whereClause).orderBy(...orderBy).limit(per_page).offset(offset),
      this.db.$count(playlist, whereClause)
    ]);

    return plainToInstance(ListPaginatedPlaylistsAddTargetsDto, {
      data: results.map(row => ({ 
        ...row.playlist, 
        role: row.role, 
        owner: row.owner,
        alreadyAdded: row.alreadyAdded 
      })),
      meta: { total_results: totalCount, total_pages: Math.ceil(totalCount / per_page), current_page: page, per_page },
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
    const { per_page, sort_order, sort_by, cursor, search, include_total_count, filter } = query;
    const cursorData = cursor ? decodeCursor<BaseCursor<string | number, number>>(cursor) : null;

    const { joinedQb, whereClause: baseWhereClause, orderBy } = this.getListBaseQuery(currentUser, type, mediaId, sort_by, sort_order, filter, search);
    const cursorWhereClause = PlaylistQueryBuilder.getCursorWhereClause(sort_by, sort_order, cursor);

    const finalWhereClause = cursorWhereClause ? and(baseWhereClause, cursorWhereClause) : baseWhereClause;
    const fetchLimit = per_page + 1;

    const [results, totalCount] = await Promise.all([
      joinedQb.where(finalWhereClause).orderBy(...orderBy).limit(fetchLimit),
      (!cursorData && include_total_count) ? this.db.$count(playlist, baseWhereClause) : Promise.resolve(undefined)
    ]);

    const hasNextPage = results.length > per_page;
    const paginatedResults = hasNextPage ? results.slice(0, per_page) : results;

    let nextCursor: string | null = null;

    if (hasNextPage) {
      const lastItem = paginatedResults[paginatedResults.length - 1].playlist;
      const cursorValue = PlaylistQueryBuilder.getNextCursorValue(lastItem, sort_by);

      if (cursorValue !== null) {
        nextCursor = encodeCursor<BaseCursor<string | number, number>>({ value: cursorValue, id: lastItem.id });
      }
    }

    return plainToInstance(ListInfinitePlaylistsAddTargetsDto, {
      data: paginatedResults.map(row => ({ 
        ...row.playlist, 
        role: row.role, 
        owner: row.owner,
        alreadyAdded: row.alreadyAdded 
      })),
      meta: { next_cursor: nextCursor, per_page, total_results: totalCount },
    });
  }
}