import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq, gt, lt, or, SQL, sql } from 'drizzle-orm';
import { logMovie, logMovieWatchedDate } from '@libs/db/schemas';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../../common/modules/drizzle/drizzle.module';
import { ListInfiniteWatchedDatesDto, ListInfiniteWatchedDatesQueryDto, ListPaginatedWatchedDatesDto, ListPaginatedWatchedDatesQueryDto, WatchedDateCreateDto, WatchedDateResponseDto, WatchedDateSortBy, WatchedDateUpdateDto } from './dto/watched-dates.dto';
import { User } from '../../../auth/auth.service';
import { DbTransaction } from '@libs/db';
import { SortOrder } from '../../../../common/dto/sort.dto';
import { BaseCursor, decodeCursor, encodeCursor } from '../../../../utils/cursor';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class MovieWatchedDatesService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  /* --------------------------------- Helper --------------------------------- */
  private async syncLogDates(tx: DbTransaction, logMovieId: number) {
    const [aggregated] = await tx
      .select({
        watchCount: sql<number>`count(*)::integer`, 
        firstWatchedAt: sql<string>`min(${logMovieWatchedDate.watchedDate})`,
        lastWatchedAt: sql<string>`max(${logMovieWatchedDate.watchedDate})`,
      })
      .from(logMovieWatchedDate)
      .where(eq(logMovieWatchedDate.logMovieId, logMovieId));

    const count = Number(aggregated?.watchCount || 0);
    const first = aggregated?.firstWatchedAt || null;
    const last = aggregated?.lastWatchedAt || null;

    await tx.update(logMovie)
      .set({ 
        watchCount: count, 
        firstWatchedAt: first, 
        lastWatchedAt: last,
      })
      .where(eq(logMovie.id, logMovieId));

    return { 
      watchCount: count, 
      firstWatchedAt: first, 
      lastWatchedAt: last 
    };
  }
  /* -------------------------------------------------------------------------- */

  async set({
    user,
    movieId,
    dto,
  }: {
    user: User;
    movieId: number;
    dto: WatchedDateCreateDto;
  }): Promise<WatchedDateResponseDto> {
    return await this.db.transaction(async (tx) => {
      const logEntry = await tx.query.logMovie.findFirst({
        where: and(eq(logMovie.userId, user.id), eq(logMovie.movieId, movieId)),
      });

      if (!logEntry) throw new NotFoundException('Movie log not found');

      const [newDate] = await tx.insert(logMovieWatchedDate).values({
        logMovieId: logEntry.id,
        watchedDate: dto.watchedDate,
        format: dto.format,
        comment: dto.comment,
      }).returning();

      const syncResult = await this.syncLogDates(tx, logEntry.id);

      return plainToInstance(WatchedDateResponseDto, {
        watchedDate: newDate,
        log: {
          ...syncResult,
          userId: logEntry.userId,
          movieId: logEntry.movieId,
        },
      });
    });
  }

  async update(
    user: User, 
    movieId: number, 
    watchedDateId: number, 
    dto: WatchedDateUpdateDto,
  ): Promise<WatchedDateResponseDto> {
    return await this.db.transaction(async (tx) => {
      const logEntry = await tx.query.logMovie.findFirst({
        where: and(eq(logMovie.userId, user.id), eq(logMovie.movieId, movieId)),
      });

      if (!logEntry) throw new NotFoundException('Movie log not found');
      
      const [updatedDate] = await tx.update(logMovieWatchedDate)
        .set({
          watchedDate: dto.watchedDate,
          format: dto.format,
          comment: dto.comment !== undefined ? dto.comment : sql`${logMovieWatchedDate.comment}`,
        })
        .where(
          and(
            eq(logMovieWatchedDate.id, watchedDateId),
            eq(logMovieWatchedDate.logMovieId, logEntry.id)
          )
        )
        .returning();

      if (!updatedDate) throw new NotFoundException('Watched date not found');

      const syncResult = await this.syncLogDates(tx, logEntry.id);

      return plainToInstance(WatchedDateResponseDto, {
        watchedDate: updatedDate,
        log: {
          ...syncResult,
          userId: logEntry.userId,
          movieId: logEntry.movieId,
        },
      });
    });
  }

  async delete(
    user: User, 
    movieId: number, 
    watchedDateId: number
  ): Promise<WatchedDateResponseDto> {
    return await this.db.transaction(async (tx) => {
      const logEntry = await tx.query.logMovie.findFirst({
        where: and(eq(logMovie.userId, user.id), eq(logMovie.movieId, movieId)),
      });

      if (!logEntry) throw new NotFoundException('Movie log not found');

      const [countResult] = await tx.select({ count: sql<number>`count(*)` })
        .from(logMovieWatchedDate)
        .where(eq(logMovieWatchedDate.logMovieId, logEntry.id));

      if (Number(countResult.count) <= 1) {
        throw new BadRequestException('Cannot delete the last watched date. Please delete the entire movie log instead.');
      }
      const [deletedDate] = await tx.delete(logMovieWatchedDate)
        .where(
          and(
            eq(logMovieWatchedDate.id, watchedDateId),
            eq(logMovieWatchedDate.logMovieId, logEntry.id)
          )
        )
        .returning();

      if (!deletedDate) throw new NotFoundException('Watched date not found');

      const syncResult = await this.syncLogDates(tx, logEntry.id);

      return plainToInstance(WatchedDateResponseDto, {
        watchedDate: deletedDate,
        log: {
          ...syncResult,
          userId: logEntry.userId,
          movieId: logEntry.movieId,
        },
      });
    });
  }

  /* ---------------------------------- List ---------------------------------- */
  private getListBaseQuery(
    movieId: number,
    currentUser: User,
    sortBy: WatchedDateSortBy,
    sortOrder: SortOrder,
  ) {
    const direction = sortOrder === SortOrder.ASC ? asc : desc;
    
    const orderBy = (() => {
      switch (sortBy) {
        case WatchedDateSortBy.WATCHED_DATE:
        default:
          return [direction(logMovieWatchedDate.watchedDate), direction(logMovieWatchedDate.id)];
      }
    })();

    const whereClause = and(
      eq(logMovie.movieId, movieId),
      eq(logMovie.userId, currentUser.id)
    );

    return { whereClause, orderBy };
  }

  async listPaginated(
    currentUser: User,
    movieId: number,
    query: ListPaginatedWatchedDatesQueryDto,
  ): Promise<ListPaginatedWatchedDatesDto> {
    const { per_page, page, sort_by, sort_order } = query;
    const offset = (page - 1) * per_page;

    const { whereClause, orderBy } = this.getListBaseQuery(
      movieId,
      currentUser,
      sort_by,
      sort_order
    );

    const [dates, totalCountResult] = await Promise.all([
      this.db
        .select({
          id: logMovieWatchedDate.id,
          watchedDate: logMovieWatchedDate.watchedDate,
          format: logMovieWatchedDate.format,
          comment: logMovieWatchedDate.comment,
        })
        .from(logMovieWatchedDate)
        .innerJoin(logMovie, eq(logMovie.id, logMovieWatchedDate.logMovieId)) // Jointure cruciale pour la sécurité
        .where(whereClause)
        .orderBy(...orderBy)
        .limit(per_page)
        .offset(offset),
      
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(logMovieWatchedDate)
        .innerJoin(logMovie, eq(logMovie.id, logMovieWatchedDate.logMovieId))
        .where(whereClause)
    ]);

    const totalCount = Number(totalCountResult[0]?.count || 0);

    return {
      data: dates,
      meta: {
        total_results: totalCount,
        total_pages: Math.ceil(totalCount / per_page),
        current_page: page,
        per_page,
      },
    };
  }

  async listInfinite(
    currentUser: User,
    movieId: number,
    query: ListInfiniteWatchedDatesQueryDto,
  ): Promise<ListInfiniteWatchedDatesDto> {
    const { per_page, sort_order, sort_by, cursor } = query;

    const cursorData = cursor ? decodeCursor<BaseCursor<string | number, number>>(cursor) : null;

    const { whereClause: baseWhereClause, orderBy } = this.getListBaseQuery(
      movieId,
      currentUser,
      sort_by,
      sort_order
    );

    let cursorWhereClause: SQL | undefined;

    if (cursorData) {
      const operator = sort_order === SortOrder.ASC ? gt : lt;

      switch (sort_by) {
        case WatchedDateSortBy.WATCHED_DATE:
        default: {
          const watchedDate = cursorData.value as string;
          cursorWhereClause = or(
            operator(logMovieWatchedDate.watchedDate, watchedDate),
            and(
              eq(logMovieWatchedDate.watchedDate, watchedDate),
              operator(logMovieWatchedDate.id, cursorData.id)
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
        id: logMovieWatchedDate.id,
        watchedDate: logMovieWatchedDate.watchedDate,
        format: logMovieWatchedDate.format,
        comment: logMovieWatchedDate.comment,
      })
      .from(logMovieWatchedDate)
      .innerJoin(logMovie, eq(logMovie.id, logMovieWatchedDate.logMovieId))
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
        case WatchedDateSortBy.WATCHED_DATE:
        default:
          cursorValue = lastItem.watchedDate;
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
      data: paginatedResults,
      meta: {
        next_cursor: nextCursor,
        per_page,
      },
    };
  }
}
