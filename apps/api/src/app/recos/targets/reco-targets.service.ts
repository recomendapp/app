import { Inject, Injectable } from '@nestjs/common';
import { aliasedTable, and, asc, desc, eq, gt, ilike, lt, max, or, SQL, sql } from 'drizzle-orm';
import { User } from '../../auth/auth.service';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle/drizzle.module';
import { follow, logMovie, logTvSeries, profile, reco, user } from '@libs/db/schemas';
import { ListAllRecoTargetsQueryDto, ListInfiniteRecoTargetsDto, ListInfiniteRecoTargetsQueryDto, ListPaginatedRecoTargetsDto, ListPaginatedRecoTargetsQueryDto, RecoTargetDto, RecoTargetSortBy } from './dto/reco-targets.dto';
import { SortOrder } from '../../../common/dto/sort.dto';
import { RecoType } from '../dto/recos.dto';
import { BaseCursor, decodeCursor, encodeCursor } from '../../../utils/cursor';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class RecoTargetsService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  private getListBaseQuery(
    currentUser: User,
    type: RecoType,
    mediaId: number,
    sortBy: RecoTargetSortBy,
    sortOrder: SortOrder,
    search?: string,
  ) {
    const direction = sortOrder === SortOrder.ASC ? asc : desc;
    const followAlias = aliasedTable(follow, 'f2');

    const latestRecoQuery = this.db
      .select({
        targetUserId: reco.userId,
        latestRecoDate: max(reco.createdAt).as('latestRecoDate'),
      })
      .from(reco)
      .where(eq(reco.senderId, currentUser.id))
      .groupBy(reco.userId)
      .as('latest_reco_sq');

    const orderBy = (() => {
      switch (sortBy) {
        case RecoTargetSortBy.RECENTLY_SENT:
        default:
          return [
            direction(sql`COALESCE(${latestRecoQuery.latestRecoDate}, ${follow.createdAt})`),
            direction(follow.followingId)
          ];
      }
    })();

    const whereClause = and(
      eq(follow.followerId, currentUser.id),
      eq(follow.status, 'accepted'),
      eq(followAlias.status, 'accepted'),
      search ? ilike(user.username, `%${search}%`) : undefined
    );

    const isMovie = type === RecoType.MOVIE;

    const baseQb = this.db
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
        },
        alreadySeen: (isMovie 
          ? sql<boolean>`${logMovie.id} IS NOT NULL`
          : sql<boolean>`${logTvSeries.id} IS NOT NULL`).as('alreadySeen'),
        alreadySent: sql<boolean>`${reco.id} IS NOT NULL`.as('alreadySent'),
        lastInteractionDate: sql<string>`COALESCE(${latestRecoQuery.latestRecoDate}, ${follow.createdAt})`.as('lastInteractionDate'),
      })
      .from(follow)
      .innerJoin(user, eq(user.id, follow.followingId))
      .innerJoin(profile, eq(profile.id, follow.followingId))
      .innerJoin(
        followAlias,
        and(
          eq(follow.followerId, followAlias.followingId),
          eq(follow.followingId, followAlias.followerId)
        )
      )
      .leftJoin(latestRecoQuery, eq(latestRecoQuery.targetUserId, follow.followingId));

    const joinedQb = isMovie
      ? baseQb
          .leftJoin(logMovie, and(
              eq(logMovie.userId, follow.followingId), 
              eq(logMovie.movieId, mediaId)
          ))
          .leftJoin(reco, and(
              eq(reco.userId, follow.followingId), 
              eq(reco.senderId, currentUser.id), 
              eq(reco.movieId, mediaId)
          ))
      : baseQb
          .leftJoin(logTvSeries, and(
              eq(logTvSeries.userId, follow.followingId), 
              eq(logTvSeries.tvSeriesId, mediaId)
          ))
          .leftJoin(reco, and(
              eq(reco.userId, follow.followingId), 
              eq(reco.senderId, currentUser.id), 
              eq(reco.tvSeriesId, mediaId)
          ));

    return { joinedQb, whereClause, orderBy, followAlias };
  }

  async listAll({
    currentUser,
    type,
    mediaId,
    query,
  }: {
    currentUser: User;
    type: RecoType;
    mediaId: number;
    query: ListAllRecoTargetsQueryDto;
  }): Promise<RecoTargetDto[]> {
    const { sort_order, sort_by, search } = query;

    const { joinedQb, whereClause, orderBy } = this.getListBaseQuery(
      currentUser, type, mediaId, sort_by, sort_order, search
    );

    const results = await joinedQb
      .where(whereClause)
      .orderBy(...orderBy);

    return plainToInstance(RecoTargetDto, results.map((row) => ({
      id: row.user.id,
      name: row.user.name,
      username: row.user.username,
      avatar: row.user.avatar,
      isPremium: row.profile.isPremium,
      alreadySeen: row.alreadySeen,
      alreadySent: row.alreadySent,
    })));
  }

  async listPaginated({
    currentUser,
    type,
    mediaId,
    query,
  }: {
    currentUser: User;
    type: RecoType;
    mediaId: number;
    query: ListPaginatedRecoTargetsQueryDto;
  }): Promise<ListPaginatedRecoTargetsDto> {
    const { per_page, sort_order, sort_by, page, search } = query;
    const offset = (page - 1) * per_page;

    const { joinedQb, whereClause, orderBy, followAlias } = this.getListBaseQuery(
      currentUser, type, mediaId, sort_by, sort_order, search
    );

    const countQuery = this.db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(follow)
      .innerJoin(user, eq(user.id, follow.followingId))
      .innerJoin(
        followAlias,
        and(
          eq(follow.followerId, followAlias.followingId),
          eq(follow.followingId, followAlias.followerId)
        )
      )
      .where(whereClause);

    const [followers, [{ count: totalCount }]] = await Promise.all([
      joinedQb
        .where(whereClause)
        .orderBy(...orderBy)
        .limit(per_page)
        .offset(offset),
      countQuery,
    ]);

    return plainToInstance(ListPaginatedRecoTargetsDto, {
      data: followers.map((row) => ({
        id: row.user.id,
        name: row.user.name,
        username: row.user.username,
        avatar: row.user.avatar,
        isPremium: row.profile.isPremium,
        alreadySeen: row.alreadySeen,
        alreadySent: row.alreadySent,
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
    type: RecoType;
    mediaId: number;
    query: ListInfiniteRecoTargetsQueryDto;
  }): Promise<ListInfiniteRecoTargetsDto> {
    const { per_page, sort_order, sort_by, cursor, search } = query;

    const cursorData = cursor ? decodeCursor<BaseCursor<string | number, string>>(cursor) : null;

    const { joinedQb, whereClause: baseWhereClause, orderBy, followAlias } = this.getListBaseQuery(
      currentUser, type, mediaId, sort_by, sort_order, search
    );

    let cursorWhereClause: SQL | undefined;

    if (cursorData) {
      const operator = sort_order === SortOrder.ASC ? gt : lt;

      switch (sort_by) {
        case RecoTargetSortBy.RECENTLY_SENT:
        default: {
          const interactionDate = String(cursorData.value);
          const latestRecoDateCol = sql`COALESCE(latest_reco_sq."latestRecoDate", ${follow.createdAt})`;

          cursorWhereClause = or(
            operator(latestRecoDateCol, interactionDate),
            and(
              eq(latestRecoDateCol, interactionDate),
              operator(follow.followingId, cursorData.id)
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

    const countQuery = this.db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(follow)
      .innerJoin(user, eq(user.id, follow.followingId))
      .innerJoin(
        followAlias,
        and(
          eq(follow.followerId, followAlias.followingId),
          eq(follow.followingId, followAlias.followerId)
        )
      )
      .where(baseWhereClause);

    const [results, totalCountResult] = await Promise.all([
      joinedQb
        .where(finalWhereClause)
        .orderBy(...orderBy)
        .limit(fetchLimit),
      !cursorData ? countQuery : Promise.resolve(undefined),
    ]);

    const totalCount = totalCountResult ? totalCountResult[0].count : undefined;
    const hasNextPage = results.length > per_page;
    const paginatedResults = hasNextPage ? results.slice(0, per_page) : results;

    let nextCursor: string | null = null;

    if (hasNextPage) {
      const lastItem = paginatedResults[paginatedResults.length - 1];
      let cursorValue: string | number | null = null;

      switch (sort_by) {
        case RecoTargetSortBy.RECENTLY_SENT:
        default:
          cursorValue = lastItem.lastInteractionDate;
          break;
      }

      if (cursorValue !== null) {
        nextCursor = encodeCursor<BaseCursor<string | number, string>>({
          value: cursorValue,
          id: lastItem.follow.followingId,
        });
      }
    }

    return plainToInstance(ListInfiniteRecoTargetsDto, {
      data: paginatedResults.map((row) => ({
        id: row.user.id,
        name: row.user.name,
        username: row.user.username,
        avatar: row.user.avatar,
        isPremium: row.profile.isPremium,
        alreadySeen: row.alreadySeen,
        alreadySent: row.alreadySent,
      })),
      meta: {
        next_cursor: nextCursor,
        per_page,
        total_results: totalCount,
      },
    });
  }
}
