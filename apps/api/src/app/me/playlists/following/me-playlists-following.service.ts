import { Inject, Injectable } from '@nestjs/common';
import { and, eq, exists, sql } from 'drizzle-orm';
import { follow, playlist, profile, user } from '@libs/db/schemas';
import { User } from '../../../auth/auth.service';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../../common/modules/drizzle/drizzle.module';
import { 
  ListPaginatedPlaylistsQueryDto, 
  ListInfinitePlaylistsQueryDto, 
  ListPaginatedPlaylistsWithOwnerDto,
  ListInfinitePlaylistsWithOwnerDto
} from '../../../playlists/dto/playlists.dto';
import { encodeCursor } from '../../../../utils/cursor';
import { plainToInstance } from 'class-transformer';
import { USER_COMPACT_SELECT } from '@libs/db/selectors';
import { PlaylistQueryBuilder } from '../../../playlists/playlists.query-builder';

@Injectable()
export class MePlaylistsFollowingService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  private getListBaseWhereClause(currentUser: User) {
    const isFollowingSubquery = this.db.select({ id: follow.followerId })
      .from(follow)
      .where(
        and(
          eq(follow.followerId, currentUser.id),
          eq(follow.followingId, playlist.userId),
          eq(follow.status, 'accepted')
        )
      );

    const visibilityCondition = PlaylistQueryBuilder.getVisibilityCondition(this.db, currentUser);

    return and(
      exists(isFollowingSubquery),
      visibilityCondition
    );
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

    const baseWhereClause = this.getListBaseWhereClause(currentUser);
    const orderBy = PlaylistQueryBuilder.getOrderBy(sort_by, sort_order);
    const roleSelection = PlaylistQueryBuilder.getRoleSelection(currentUser);

    const [results, totalCount] = await Promise.all([
      this.db
        .select({
          playlist: playlist,
          role: roleSelection,
          owner: USER_COMPACT_SELECT,
        })
        .from(playlist)
        .innerJoin(user, eq(playlist.userId, user.id))
        .innerJoin(profile, eq(user.id, profile.id))
        .where(baseWhereClause)
        .orderBy(...orderBy)
        .limit(per_page)
        .offset(offset),
      this.db.$count(playlist, baseWhereClause),
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

    const baseWhereClause = this.getListBaseWhereClause(currentUser);
    const orderBy = PlaylistQueryBuilder.getOrderBy(sort_by, sort_order);
    const roleSelection = PlaylistQueryBuilder.getRoleSelection(currentUser);

    const cursorWhereClause = PlaylistQueryBuilder.getCursorWhereClause(sort_by, sort_order, cursor);
    const finalWhereClause = cursorWhereClause 
      ? and(baseWhereClause, cursorWhereClause) 
      : baseWhereClause;

    const fetchLimit = per_page + 1;

    const [results, totalCountResult] = await Promise.all([
      this.db
        .select({
          playlist: playlist,
          role: roleSelection,
          owner: USER_COMPACT_SELECT,
        })
        .from(playlist)
        .innerJoin(user, eq(playlist.userId, user.id))
        .innerJoin(profile, eq(user.id, profile.id))
        .where(finalWhereClause)
        .orderBy(...orderBy)
        .limit(fetchLimit),
      (include_total_count && !cursor)
        ? this.db.select({ count: sql<number>`cast(count(*) as int)` }).from(playlist).where(baseWhereClause)
        : Promise.resolve(undefined)
    ]);

    const totalCount = totalCountResult ? totalCountResult[0].count : undefined;
    const hasNextPage = results.length > per_page;
    const paginatedResults = hasNextPage ? results.slice(0, per_page) : results;

    let nextCursor: string | null = null;

    if (hasNextPage) {
      const lastItem = paginatedResults[paginatedResults.length - 1].playlist;
      const cursorValue = PlaylistQueryBuilder.getNextCursorValue(lastItem, sort_by);

      if (cursorValue !== null) {
        nextCursor = encodeCursor({ 
          value: cursorValue, 
          id: lastItem.id 
        });
      }
    }

    return plainToInstance(ListInfinitePlaylistsWithOwnerDto, {
      data: paginatedResults.map(row => ({
        ...row.playlist,
        role: row.role,
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