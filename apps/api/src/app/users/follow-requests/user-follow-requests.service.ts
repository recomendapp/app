import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle.module';
import { FollowRequestSortBy, ListInfiniteFollowRequestsQueryDto, ListPaginatedFollowRequestsQueryDto } from './dto/user-follow-requests.dto';
import { SortOrder } from '../../../common/dto/sort.dto';
import { and, asc, desc, eq, gt, lt, or, SQL, sql } from 'drizzle-orm';
import { follow, profile, user } from '@libs/db/schemas';
import { BaseCursor, decodeCursor, encodeCursor } from '../../../utils/cursor';

@Injectable()
export class UserFollowRequestsService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  private getListBaseQuery(
    currentUserId: string, 
    sortBy: FollowRequestSortBy, 
    sortOrder: SortOrder
  ) {
    const direction = sortOrder === SortOrder.ASC ? asc : desc;
    
    const orderBy = (() => {
      switch (sortBy) {
        case FollowRequestSortBy.FOLLOWERs_COUNT:
          return [direction(profile.followersCount), direction(follow.followerId)];
        case FollowRequestSortBy.CREATED_AT:
        default:
          return [direction(follow.createdAt), direction(follow.followerId)];
      }
    })();

    const whereClause = and(
      eq(follow.followingId, currentUserId),
      eq(follow.status, 'pending')
    );

    return { whereClause, orderBy };
  }

  async listPaginated({
    currentUserId,
    query,
  }: {
    currentUserId: string,
    query: ListPaginatedFollowRequestsQueryDto
  }) {
    const { per_page, sort_order, sort_by, page } = query;
    const offset = (page - 1) * per_page;

    const { whereClause, orderBy } = this.getListBaseQuery(
      currentUserId, 
      sort_by, 
      sort_order
    );

    const [requests, totalCount] = await Promise.all([
      this.db
        .select({
          follow: follow,
          user: user,
          profile: profile,
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
      data: requests.map((row) => ({
        createdAt: row.follow.createdAt,
        user: {
          id: row.user.id,
          username: row.user.username,
          name: row.user.name,
          avatar: row.user.image,
          isPremium: row.profile.isPremium,
        }
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
    currentUserId,
    query,
  }: {
    currentUserId: string,
    query: ListInfiniteFollowRequestsQueryDto
  }) {
    const { per_page, sort_order, sort_by, cursor } = query;

    const cursorData = cursor ? decodeCursor<BaseCursor<string | number, string>>(cursor) : null;

    const { whereClause: baseWhereClause, orderBy } = this.getListBaseQuery(
      currentUserId, 
      sort_by, 
      sort_order
    );

    let cursorWhereClause: SQL | undefined;

    if (cursorData) {
      const operator = sort_order === SortOrder.ASC ? gt : lt;

      switch (sort_by) {
        case FollowRequestSortBy.FOLLOWERs_COUNT: {
          const followersCount = Number(cursorData.value);
          cursorWhereClause = or(
            operator(profile.followersCount, followersCount),
            and(
              eq(profile.followersCount, followersCount),
              operator(follow.followerId, cursorData.id)
            )
          );
          break;
        }
        case FollowRequestSortBy.CREATED_AT:
        default: {
          const createdDate = String(cursorData.value);
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

    const [results, totalCount] = await Promise.all([
      this.db
        .select({
          follow: follow,
          user: user,
          profile: profile,
        })
        .from(follow)
        .innerJoin(user, eq(user.id, follow.followerId))
        .innerJoin(profile, eq(profile.id, follow.followerId))
        .where(finalWhereClause)
        .orderBy(...orderBy)
        .limit(fetchLimit),
      !cursorData ? this.db.$count(follow, baseWhereClause) : undefined,
    ]);

    const hasNextPage = results.length > per_page;
    const paginatedResults = hasNextPage ? results.slice(0, per_page) : results;

    let nextCursor: string | null = null;

    if (hasNextPage) {
      const lastItem = paginatedResults[paginatedResults.length - 1];
      let cursorValue: string | number | null = null;

      switch (sort_by) {
        case FollowRequestSortBy.FOLLOWERs_COUNT:
          cursorValue = lastItem.profile.followersCount ?? 0;
          break;
        case FollowRequestSortBy.CREATED_AT:
        default:
          cursorValue = lastItem.follow.createdAt;
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
        createdAt: row.follow.createdAt,
        user: {
          id: row.user.id,
          username: row.user.username,
          name: row.user.name,
          avatar: row.user.image,
          isPremium: row.profile.isPremium,
        }
      })),
      meta: {
        next_cursor: nextCursor,
        per_page,
        total_results: totalCount,
      },
    };
  }
}
