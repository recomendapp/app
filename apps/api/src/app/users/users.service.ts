import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DRIZZLE_SERVICE, DrizzleService } from '../../common/modules/drizzle/drizzle.module';
import { and, asc, desc, eq, gt, lt, or, sql, SQL } from 'drizzle-orm';
import { profile, user, follow } from '@libs/db/schemas';
import { ListInfiniteUsersDto, ListInfiniteUsersQueryDto, ListPaginatedUsersDto, ListPaginatedUsersQueryDto, ProfileDto, UserSortBy } from './dto/users.dto';
import { User } from '../auth/auth.service';
import { plainToInstance } from 'class-transformer';
import { isUUID } from 'class-validator';
import { USER_RULES } from '../../config/validation-rules';
import { SortOrder } from '../../common/dto/sort.dto';
import { BaseCursor, decodeCursor, encodeCursor } from '../../utils/cursor';

@Injectable()
export class UsersService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  async get(identifier: string, currentUser: User | null): Promise<ProfileDto> {
    let isUsernameSearch = false;
    let searchValue = identifier;

    if (identifier.startsWith('@')) {
      isUsernameSearch = true;
      searchValue = identifier.substring(1);
      if (!USER_RULES.USERNAME.REGEX.test(searchValue)) {
        throw new BadRequestException('Invalid username format.');
      }
    } else {
      if (!isUUID(identifier, '7')) { 
        throw new BadRequestException('Invalid User ID format. Use UUID or @username.');
      }
    }
    const whereClause = isUsernameSearch
      ? eq(user.username, searchValue.toLowerCase())
      : eq(user.id, searchValue);

    let isVisibleLogic: SQL;

    const isOwner = currentUser && (
      (isUsernameSearch && currentUser.username?.toLowerCase() === searchValue.toLowerCase()) ||
      (!isUsernameSearch && currentUser.id === searchValue)
    );

    if (isOwner) {
      isVisibleLogic = sql<boolean>`true`;
    } else if (!currentUser) {
      isVisibleLogic = sql<boolean>`NOT ${profile.isPrivate}`;
    } else {
      isVisibleLogic = sql<boolean>`
        (
          NOT ${profile.isPrivate} 
          OR EXISTS (
            SELECT 1 FROM ${follow} 
            WHERE ${follow.followerId} = ${currentUser.id} 
            AND ${follow.followingId} = ${user.id} 
            AND ${follow.status} = 'accepted'
          )
        )
      `;
    }

    const [result] = await this.db
      .select({
        id: user.id,
        name: user.name,
        username: user.username,
        avatar: user.image,
        createdAt: user.createdAt,
        bio: profile.bio,
        backgroundImage: profile.backgroundImage,
        language: user.language,
        isPremium: profile.isPremium,
        isPrivate: profile.isPrivate,
        followersCount: profile.followersCount,
        followingCount: profile.followingCount,
        isVisible: isVisibleLogic.as('is_visible'),
      })
      .from(user)
      .leftJoin(profile, eq(profile.id, user.id))
      .where(whereClause)
      .limit(1);

    if (!result) {
      throw new NotFoundException('User profile not found');
    }

    return plainToInstance(ProfileDto, result, {
      excludeExtraneousValues: true,
    });
  }

  /* ---------------------------------- Helpers --------------------------------- */
  private getListBaseQuery(sortBy: UserSortBy, sortOrder: SortOrder) {
    const direction = sortOrder === SortOrder.ASC ? asc : desc;
    
    const orderBy = (() => {
      switch (sortBy) {
        case UserSortBy.RANDOM:
          return [sql`RANDOM()`];
        case UserSortBy.FOLLOWERS_COUNT:
          return [direction(profile.followersCount), direction(user.id)];
        case UserSortBy.CREATED_AT:
        default:
          return [direction(user.createdAt), direction(user.id)];
      }
    })();

    return { orderBy };
  }

  /* ---------------------------------- Paginated --------------------------------- */
  async listPaginated(query: ListPaginatedUsersQueryDto): Promise<ListPaginatedUsersDto> {
    const { per_page, sort_order, sort_by, page } = query;
    const offset = (page - 1) * per_page;

    const { orderBy } = this.getListBaseQuery(sort_by, sort_order);

    const [results, [{ count: totalCount }]] = await Promise.all([
      this.db
        .select({
          id: user.id,
          name: user.name,
          username: user.username,
          avatar: user.image,
          isPremium: profile.isPremium,
        })
        .from(user)
        .leftJoin(profile, eq(user.id, profile.id))
        .orderBy(...orderBy)
        .limit(per_page)
        .offset(offset),
      this.db.select({ count: sql<number>`cast(count(*) as int)` }).from(user),
    ]);

    return plainToInstance(ListPaginatedUsersDto, {
      data: results,
      meta: {
        total_results: totalCount,
        total_pages: Math.ceil(totalCount / per_page),
        current_page: page,
        per_page,
      },
    }, { excludeExtraneousValues: true });
  }

  /* ---------------------------------- Infinite --------------------------------- */
  async listInfinite(query: ListInfiniteUsersQueryDto): Promise<ListInfiniteUsersDto> {
    const { per_page, sort_order, sort_by, cursor, include_total_count } = query;

    const cursorData = cursor ? decodeCursor<BaseCursor<string | number, string>>(cursor) : null;

    const { orderBy } = this.getListBaseQuery(sort_by, sort_order);

    let cursorWhereClause: SQL | undefined;

    if (cursorData) {
      const operator = sort_order === SortOrder.ASC ? gt : lt;

      switch (sort_by) {
        case UserSortBy.FOLLOWERS_COUNT: {
          cursorWhereClause = or(
            operator(profile.followersCount, Number(cursorData.value)),
            and(
              eq(profile.followersCount, Number(cursorData.value)),
              operator(user.id, cursorData.id)
            )
          );
          break;
        }

        case UserSortBy.RANDOM:
          break;

        case UserSortBy.CREATED_AT:
        default: {
          const createdDate = String(cursorData.value);
          cursorWhereClause = or(
            operator(user.createdAt, createdDate),
            and(
              eq(user.createdAt, createdDate),
              operator(user.id, cursorData.id)
            )
          );
          break;
        }
      }
    }

    const fetchLimit = per_page + 1;

    const [results, totalCount] = await Promise.all([
      this.db
        .select({
          id: user.id,
          name: user.name,
          username: user.username,
          avatar: user.image,
          isPremium: profile.isPremium,
          createdAt: user.createdAt,
          followersCount: profile.followersCount, 
        })
        .from(user)
        .leftJoin(profile, eq(user.id, profile.id))
        .where(cursorWhereClause)
        .orderBy(...orderBy)
        .limit(fetchLimit),
      (!cursorData && include_total_count)
        ? this.db.$count(user)
        : Promise.resolve(undefined)
    ]);

    const hasNextPage = results.length > per_page;
    const paginatedResults = hasNextPage ? results.slice(0, per_page) : results;

    let nextCursor: string | null = null;

    if (hasNextPage) {
      const lastItem = paginatedResults[paginatedResults.length - 1];
      let cursorValue: string | number | null = null;

      switch (sort_by) {
        case UserSortBy.FOLLOWERS_COUNT:
          cursorValue = lastItem.followersCount ?? 0;
          break;
        case UserSortBy.CREATED_AT:
        default:
          cursorValue = lastItem.createdAt;
          break;
      }

      if (cursorValue !== null) {
        nextCursor = encodeCursor<BaseCursor<string | number, string>>({
          value: cursorValue,
          id: lastItem.id,
        });
      }
    }

    return plainToInstance(ListInfiniteUsersDto, {
      data: paginatedResults,
      meta: {
        next_cursor: nextCursor,
        per_page,
        total_results: totalCount,
      },
    }, { excludeExtraneousValues: true });
  }
}
