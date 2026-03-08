import { Inject, Injectable, Logger } from '@nestjs/common';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle/drizzle.module';
import { playlist, playlistMember, profile, user } from '@libs/db/schemas';
import { and, asc, desc, eq, gt, ilike, lt, notInArray, or, SQL, sql } from 'drizzle-orm';
import { plainToInstance } from 'class-transformer';
import { 
  ListAllPlaylistMembersQueryDto, 
  ListInfinitePlaylistMembersDto, 
  ListInfinitePlaylistMembersQueryDto, 
  ListPaginatedPlaylistMembersDto, 
  ListPaginatedPlaylistMembersQueryDto, 
  PlaylistMemberSortBy, 
  PlaylistMemberUpdateDto, 
  PlaylistMemberWithUserDto 
} from './playlist-members.dto';
import { SortOrder } from '../../../common/dto/sort.dto';
import { BaseCursor, decodeCursor, encodeCursor } from '../../../utils/cursor';
import { USER_COMPACT_SELECT } from '@libs/db/selectors';

@Injectable()
export class PlaylistMembersService {
  private readonly logger = new Logger(PlaylistMembersService.name);

  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  private getListBaseQuery(
    playlistId: number,
    sortBy: PlaylistMemberSortBy,
    sortOrder: SortOrder,
    search?: string,
  ) {
    const direction = sortOrder === SortOrder.ASC ? asc : desc;

    const orderBy = (() => {
      switch (sortBy) {
        case PlaylistMemberSortBy.CREATED_AT:
        default:
          return [direction(playlistMember.createdAt), direction(playlistMember.id)];
      }
    })();

    const whereClause = and(
      eq(playlistMember.playlistId, playlistId),
      search ? ilike(user.username, `%${search}%`) : undefined
    );

    const joinedQb = this.db
      .select({
        member: playlistMember,
        user: USER_COMPACT_SELECT,
      })
      .from(playlistMember)
      .innerJoin(user, eq(user.id, playlistMember.userId))
      .innerJoin(profile, eq(profile.id, user.id));

    return { joinedQb, whereClause, orderBy };
  }
  async listAll({
    playlistId,
    query,
  }: {
    playlistId: number;
    query: ListAllPlaylistMembersQueryDto;
  }): Promise<PlaylistMemberWithUserDto[]> {
    const { sort_order, sort_by, search } = query;
    const { joinedQb, whereClause, orderBy } = this.getListBaseQuery(playlistId, sort_by, sort_order, search);

    const results = await joinedQb.where(whereClause).orderBy(...orderBy);

    return plainToInstance(PlaylistMemberWithUserDto, results.map((row) => ({
      ...row.member,
      user: row.user,
    })));
  }
  async listPaginated({
    playlistId,
    query,
  }: {
    playlistId: number;
    query: ListPaginatedPlaylistMembersQueryDto;
  }): Promise<ListPaginatedPlaylistMembersDto> {
    const { per_page, page, sort_order, sort_by, search } = query;
    const offset = (page - 1) * per_page;

    const { joinedQb, whereClause, orderBy } = this.getListBaseQuery(playlistId, sort_by, sort_order, search);

    const [results, [{ count: totalCount }]] = await Promise.all([
      joinedQb
        .where(whereClause)
        .orderBy(...orderBy)
        .limit(per_page)
        .offset(offset),
      this.db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(playlistMember)
        .innerJoin(user, eq(user.id, playlistMember.userId))
        .where(whereClause)
    ]);

    return plainToInstance(ListPaginatedPlaylistMembersDto, {
      data: results.map((row) => ({
        ...row.member,
        user: row.user,
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
    playlistId,
    query,
  }: {
    playlistId: number;
    query: ListInfinitePlaylistMembersQueryDto;
  }): Promise<ListInfinitePlaylistMembersDto> {
    const { per_page, sort_order, sort_by, cursor, search, include_total_count } = query;
    const cursorData = cursor ? decodeCursor<BaseCursor<string, number>>(cursor) : null;

    const { joinedQb, whereClause: baseWhereClause, orderBy } = this.getListBaseQuery(playlistId, sort_by, sort_order, search);

    let cursorWhereClause: SQL | undefined;

    if (cursorData) {
      const operator = sort_order === SortOrder.ASC ? gt : lt;
      switch (sort_by) {
        case PlaylistMemberSortBy.CREATED_AT:
        default: {
          cursorWhereClause = or(
            operator(playlistMember.createdAt, String(cursorData.value)),
            and(
              eq(playlistMember.createdAt, String(cursorData.value)),
              operator(playlistMember.id, Number(cursorData.id))
            )
          );
          break;
        }
      }
    }

    const finalWhereClause = cursorWhereClause ? and(baseWhereClause, cursorWhereClause) : baseWhereClause;
    const fetchLimit = per_page + 1;

    const [results, totalCountResult] = await Promise.all([
      joinedQb
        .where(finalWhereClause)
        .orderBy(...orderBy)
        .limit(fetchLimit),
      (!cursorData && include_total_count)
        ? this.db
            .select({ count: sql<number>`cast(count(*) as int)` })
            .from(playlistMember)
            .innerJoin(user, eq(user.id, playlistMember.userId))
            .where(baseWhereClause)
        : Promise.resolve(undefined)
    ]);

    const totalCount = totalCountResult ? totalCountResult[0].count : undefined;
    const hasNextPage = results.length > per_page;
    const paginatedResults = hasNextPage ? results.slice(0, per_page) : results;

    let nextCursor: string | null = null;
    if (hasNextPage) {
      const lastItem = paginatedResults[paginatedResults.length - 1].member;
      nextCursor = encodeCursor<BaseCursor<string, number>>({
        value: lastItem.createdAt,
        id: lastItem.id,
      });
    }

    return plainToInstance(ListInfinitePlaylistMembersDto, {
      data: paginatedResults.map((row) => ({
        ...row.member,
        user: row.user
      })),
      meta: {
        next_cursor: nextCursor,
        per_page,
        total_results: totalCount,
      },
    }, { excludeExtraneousValues: true });
  }

  /* -------------------------------- Mutations ------------------------------- */

  async updateAll({
    playlistId,
    updateMembersDto,
  }: {
    playlistId: number;
    updateMembersDto: PlaylistMemberUpdateDto;
  }): Promise<PlaylistMemberWithUserDto[]> {
    const membersToUpsert = updateMembersDto.members.map((member) => ({
      playlistId, 
      userId: member.userId,
      role: member.role,
    }));
    const userIdsToKeep = membersToUpsert.map((m) => m.userId);

    const updatedMembers = await this.db.transaction(async (tx) => {
      await tx
        .update(playlist)
        .set({ updatedAt: sql`now()` }) 
        .where(eq(playlist.id, playlistId));

      if (userIdsToKeep.length > 0) {
        await tx.delete(playlistMember)
          .where(and(
              eq(playlistMember.playlistId, playlistId),
              notInArray(playlistMember.userId, userIdsToKeep)
            ));
      } else {
        await tx.delete(playlistMember).where(eq(playlistMember.playlistId, playlistId));
      }

      if (membersToUpsert.length > 0) {
        await tx.insert(playlistMember)
          .values(membersToUpsert)
          .onConflictDoUpdate({
            target: [playlistMember.playlistId, playlistMember.userId],
            set: { role: sql`excluded.role` },
          });
      }

      return tx
        .select({
          member: playlistMember,
          user: USER_COMPACT_SELECT,
        })
        .from(playlistMember)
        .innerJoin(user, eq(user.id, playlistMember.userId))
        .innerJoin(profile, eq(profile.id, user.id))
        .where(eq(playlistMember.playlistId, playlistId));
    });

    return plainToInstance(PlaylistMemberWithUserDto, updatedMembers.map((row) => ({
      ...row.member,
      user: row.user,
    })));
  }
}