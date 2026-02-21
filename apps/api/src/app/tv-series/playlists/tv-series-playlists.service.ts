import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, exists, gt, lt, or, sql, SQL } from 'drizzle-orm';
import { follow, playlist, playlistItem, playlistMember, profile, user } from '@libs/db/schemas';
import { User } from '../../auth/auth.service';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle.module';
import { SortOrder } from '../../../common/dto/sort.dto';
import { DbTransaction } from '@libs/db';
import { BaseCursor, decodeCursor, encodeCursor } from '../../../utils/cursor';
import { ListInfinitePlaylistsQueryDto, ListInfinitePlaylistsWithOwnerDto, ListPlaylistsQueryDto, ListPlaylistsWithOwnerDto, PlaylistSortBy } from '../../playlists/dto/playlists.dto';

@Injectable()
export class TvSeriesPlaylistsService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  private getListBaseQuery(
    tx: DbTransaction,
    tvSeriesId: number,
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

    let isVisibleLogic: SQL;

    if (!currentUser) {
      isVisibleLogic = eq(playlist.visibility, 'public');
    } else {
      const isFollowingSubquery = tx
        .select({ is_following: sql<boolean>`true` })
        .from(follow)
        .where(
          and(
            eq(follow.followerId, currentUser.id),
            eq(follow.followingId, playlist.userId),
            eq(follow.status, 'accepted')
          )
        )
        .limit(1);

      const isMemberSubquery = tx
        .select({ is_member: sql<boolean>`true` })
        .from(playlistMember)
        .where(
          and(
            eq(playlistMember.playlistId, playlist.id),
            eq(playlistMember.userId, currentUser.id)
          )
        )
        .limit(1);

      isVisibleLogic = or(
        eq(playlist.userId, currentUser.id),
        eq(playlist.visibility, 'public'),
        and(
          eq(playlist.visibility, 'followers'),
          exists(isFollowingSubquery)
        ),
        exists(isMemberSubquery)
      );
    }

    const whereClause = and(
      eq(playlistItem.tvSeriesId, tvSeriesId),
      eq(playlistItem.type, 'tv_series'),
      isVisibleLogic
    );

    return { whereClause, orderBy };
  }
  async list({
    tvSeriesId,
    query,
    currentUser,
  }: {
    tvSeriesId: number;
    query: ListPlaylistsQueryDto,
    currentUser: User | null;
  }): Promise<ListPlaylistsWithOwnerDto> {
    return await this.db.transaction(async (tx) => {
      const { per_page, page, sort_by, sort_order } = query;
      const offset = (page - 1) * per_page;

      const { whereClause, orderBy } = this.getListBaseQuery(
        tx,
        tvSeriesId, 
        currentUser, 
        sort_by, 
        sort_order
      );

      const [rows, totalCountResult] = await Promise.all([
        tx.select({
            playlist: playlist,
            owner: {
              id: user.id,
              name: user.name,
              username: user.username,
              avatar: user.image,
              isPremium: profile.isPremium,
            }
          })
          .from(playlist)
          .innerJoin(playlistItem, eq(playlistItem.playlistId, playlist.id))
          .innerJoin(user, eq(user.id, playlist.userId))
          .innerJoin(profile, eq(profile.id, user.id))
          .where(whereClause)
          .orderBy(...orderBy)
          .limit(per_page)
          .offset(offset),
        tx.select({ count: sql<number>`count(*)` })
          .from(playlist)
          .innerJoin(playlistItem, eq(playlistItem.playlistId, playlist.id))
          .where(whereClause)
      ]);
    
      const totalCount = Number(totalCountResult[0]?.count || 0);
      const totalPages = Math.ceil(totalCount / per_page);

      return {
        data: rows.map((row) => ({
          ...row.playlist,
          owner: row.owner,
        })),
        meta: {
          total_results: totalCount,
          total_pages: totalPages,
          current_page: page,
          per_page,
        },
      };
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

      const cursorData = cursor ? decodeCursor<BaseCursor<string | number, number>>(cursor) : null;

      const { whereClause: baseWhereClause, orderBy } = this.getListBaseQuery(
        tx, 
        tvSeriesId, 
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

      const results = await tx
        .select({
          playlist: playlist,
          owner: {
            id: user.id,
            name: user.name,
            username: user.username,
            avatar: user.image,
            isPremium: profile.isPremium,
          }
        })
        .from(playlist)
        .innerJoin(playlistItem, eq(playlistItem.playlistId, playlist.id))
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
        data: paginatedResults.map((row) => ({
          ...row.playlist,
          owner: row.owner,
        })),
        meta: {
          next_cursor: nextCursor,
          per_page,
        },
      };
    });
  }
}
