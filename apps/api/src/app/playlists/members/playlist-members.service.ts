import { ForbiddenException, Inject, Injectable, Logger } from '@nestjs/common';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle/drizzle.module';
import { playlist, playlistMember, profile, user } from '@libs/db/schemas';
import { and, asc, desc, eq, gt, ilike, inArray, lt, or, SQL, sql } from 'drizzle-orm';
import { plainToInstance } from 'class-transformer';
import { 
  ListAllPlaylistMembersQueryDto, 
  ListInfinitePlaylistMembersDto, 
  ListInfinitePlaylistMembersQueryDto, 
  ListPaginatedPlaylistMembersDto, 
  ListPaginatedPlaylistMembersQueryDto, 
  PlaylistMemberAddDto, 
  PlaylistMemberDto, 
  PlaylistMemberSortBy, 
  PlaylistMemberUpdateDto, 
  PlaylistMemberWithUserDto 
} from './playlist-members.dto';
import { SortOrder } from '../../../common/dto/sort.dto';
import { BaseCursor, decodeCursor, encodeCursor } from '../../../utils/cursor';
import { USER_COMPACT_SELECT } from '@libs/db/selectors';
import { WorkerClient } from '@shared/worker';

@Injectable()
export class PlaylistMembersService {
  private readonly logger = new Logger(PlaylistMembersService.name);

  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
    private readonly workerClient: WorkerClient,
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

  async add({
    playlistId,
    dto,
  }: {
    playlistId: number;
    dto: PlaylistMemberAddDto;
  }): Promise<PlaylistMemberDto[]> {
    if (dto.userIds.length === 0) return [];

    const result = await this.db.transaction(async (tx) => {
      const valuesToInsert = dto.userIds.map(userId => ({
        playlistId,
        userId,
        role: 'viewer' as const
      }));

      const insertedMembers = await tx.insert(playlistMember)
        .values(valuesToInsert)
        .onConflictDoNothing()
        .returning();

      return plainToInstance(PlaylistMemberDto, insertedMembers);
    });

    if (result.length > 0) {
      this.workerClient.emit('search:sync-playlist', {
        playlistId: playlistId,
        action: 'upsert'
      }).catch(err => this.logger.error(`Failed to emit search sync after adding members to playlist ${playlistId}`, err));
    }

    return result;
  }

  async update({
    playlistId,
    targetUserId,
    dto,
  }: {
    playlistId: number;
    targetUserId: string;
    dto: PlaylistMemberUpdateDto;
  }): Promise<PlaylistMemberDto> {
    if (dto.role !== 'viewer') {
      const ownerProfile = await this.db
        .select({ isPremium: profile.isPremium })
        .from(playlist)
        .innerJoin(profile, eq(profile.id, playlist.userId))
        .where(eq(playlist.id, playlistId))
        .limit(1)
        .then(res => res[0]);

      if (!ownerProfile || !ownerProfile.isPremium) {
        throw new ForbiddenException('The playlist owner must be Premium to assign another role than viewer');
      }
    }

    return await this.db.transaction(async (tx) => {
      const [updatedMember] = await tx.update(playlistMember)
        .set({ role: dto.role })
        .where(and(
          eq(playlistMember.playlistId, playlistId),
          eq(playlistMember.userId, targetUserId)
        ))
        .returning();

      if (!updatedMember) {
         throw new ForbiddenException('Member not found in this playlist');
      }

      return plainToInstance(PlaylistMemberDto, updatedMember);
    });
  }

  async delete({
    playlistId,
    userIds,
  }: {
    playlistId: number;
    userIds: string[];
  }): Promise<PlaylistMemberDto[]> {
    if (userIds.length === 0) return [];

    const deletedMembers = await this.db.delete(playlistMember)
      .where(and(
        eq(playlistMember.playlistId, playlistId),
        inArray(playlistMember.userId, userIds) 
      ))
      .returning();

    if (deletedMembers.length > 0) {
      this.workerClient.emit('search:sync-playlist', {
        playlistId: playlistId,
        action: 'upsert'
      }).catch(err => this.logger.error(`Failed to emit search sync after deleting members from playlist ${playlistId}`, err));
    }

    return plainToInstance(PlaylistMemberDto, deletedMembers);
  }
}