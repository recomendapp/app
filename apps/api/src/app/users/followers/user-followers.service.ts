import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq, gt, lt, or, SQL, sql } from 'drizzle-orm';
import { follow, profile, user } from '@libs/db/schemas';
import { User } from '../../auth/auth.service';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle.module';
import { SortOrder } from '../../../common/dto/sort.dto';
import { BaseCursor, decodeCursor, encodeCursor } from '../../../utils/cursor';
import { ListInfiniteUsersDto, ListInfiniteUsersQueryDto, ListUsersDto, ListUsersQueryDto, UserSortBy } from '../dto/users.dto';

@Injectable()
export class UserFollowersService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  private async getListBaseQuery(
    targetUserId: string,
    currentUser: User | null,
    sortBy: UserSortBy,
    sortOrder: SortOrder,
  ) {
    if (currentUser?.id !== targetUserId) {
      const [targetData] = await this.db
        .select({
          isPrivate: profile.isPrivate,
          isFollowing: currentUser
            ? sql<boolean>`EXISTS (
                SELECT 1 FROM ${follow} 
                WHERE ${follow.followerId} = ${currentUser.id} 
                  AND ${follow.followingId} = ${targetUserId} 
                  AND ${follow.status} = 'accepted'
              )`
            : sql<boolean>`false`,
        })
        .from(profile)
        .where(eq(profile.id, targetUserId))
        .limit(1);

      if (!targetData) {
        throw new NotFoundException('User not found');
      }

      if (targetData.isPrivate) {
        if (!currentUser) {
          throw new ForbiddenException('This account is private');
        }
        if (!targetData.isFollowing) {
          throw new ForbiddenException('This account is private. Follow this user to see their followers.');
        }
      }
    }

    const direction = sortOrder === SortOrder.ASC ? asc : desc;
  
    const orderBy = (() => {
      switch (sortBy) {
        case UserSortBy.RANDOM:
          return [sql`RANDOM()`];
        case UserSortBy.FOLLOWERS_COUNT:
          return [direction(profile.followersCount), direction(follow.followerId)];
        case UserSortBy.CREATED_AT:
        default:
          return [direction(follow.createdAt), direction(follow.followerId)];
      }
    })();

    const whereClause = and(
      eq(follow.followingId, targetUserId),
      eq(follow.status, 'accepted')
    );

    return { whereClause, orderBy };
  }
  async list({
    targetUserId,
    query,
    currentUser,
  }: {
    targetUserId: string,
    query: ListUsersQueryDto,
    currentUser: User | null
  }): Promise<ListUsersDto> {
    const { per_page, sort_order, sort_by, page } = query;
    const offset = (page - 1) * per_page;

    const { whereClause, orderBy } = await this.getListBaseQuery(
      targetUserId,
      currentUser,
      sort_by,
      sort_order
    );

    const [followers, totalCount] = await Promise.all([
      this.db
        .select({
          follow: follow,
          user: {
            id: user.id,
            name: user.name,
            username: user.username,
            avatar: user.image,
          },
          profile: {
            isPremium: profile.isPremium,
          }
        })
        .from(follow)
        .innerJoin(user, eq(user.id, follow.followerId))
        .innerJoin(profile, eq(profile.id, follow.followerId))
        .where(whereClause)
        .orderBy(...orderBy)
        .limit(per_page)
        .offset(offset),
      this.db.$count(follow, whereClause),
    ]);

    return {
      data: followers.map((row) => ({
        id: row.user.id,
        name: row.user.name,
        username: row.user.username,
        avatar: row.user.avatar,
        isPremium: row.profile.isPremium,
      })),
      meta: {
        total_results: totalCount,
        total_pages: Math.ceil(totalCount / per_page),
        current_page: page,
        per_page,
      },
    };
  }
  async listInfinite({
    targetUserId,
    query,
    currentUser,
  }: {
    targetUserId: string,
    query: ListInfiniteUsersQueryDto,
    currentUser: User | null
  }): Promise<ListInfiniteUsersDto> {
    const { per_page, sort_order, sort_by, cursor } = query;

    const cursorData = cursor ? decodeCursor<BaseCursor<string | number, string>>(cursor) : null;

    const { whereClause: baseWhereClause, orderBy } = await this.getListBaseQuery(
      targetUserId,
      currentUser,
      sort_by,
      sort_order
    );

    let cursorWhereClause: SQL | undefined;

    if (cursorData) {
      const operator = sort_order === SortOrder.ASC ? gt : lt;

      switch (sort_by) {
        case UserSortBy.FOLLOWERS_COUNT: {
          cursorWhereClause = or(
            operator(profile.followersCount, Number(cursorData.value)),
            and(
              eq(profile.followersCount, Number(cursorData.value)),
              operator(follow.followerId, cursorData.id)
            )
          );
          break;
        }

        case UserSortBy.RANDOM:
          break;

        case UserSortBy.CREATED_AT:
        default: {
          const createdDate = new Date(cursorData.value);
          cursorWhereClause = or(
            operator(follow.createdAt, createdDate),
            and(
              eq(follow.createdAt, createdDate),
              operator(follow.followerId, cursorData.id)
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
        follow: follow,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          avatar: user.image,
        },
        profile: {
          isPremium: profile.isPremium,
          followersCount: profile.followersCount,
        }
      })
      .from(follow)
      .innerJoin(user, eq(user.id, follow.followerId))
      .innerJoin(profile, eq(profile.id, follow.followerId))
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
        case UserSortBy.FOLLOWERS_COUNT:
          cursorValue = lastItem.profile.followersCount ?? 0;
          break;
        case UserSortBy.CREATED_AT:
        default:
          cursorValue = lastItem.follow.createdAt.toISOString();
          break;
      }

      if (cursorValue !== null) {
        nextCursor = encodeCursor<BaseCursor<string | number, string>>({
          value: cursorValue,
          id: lastItem.follow.followerId,
        });
      }
    }

    return {
      data: paginatedResults.map((row) => ({
        id: row.user.id,
        name: row.user.name,
        username: row.user.username,
        avatar: row.user.avatar,
        isPremium: row.profile.isPremium,
      })),
      meta: {
        next_cursor: nextCursor,
        per_page,
      },
    };
  }
}
