import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq, gt, inArray, sql } from 'drizzle-orm';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle/drizzle.module';
import { importJob, importJobBookmark, tmdbMovieView, tmdbTvSeriesView } from '@libs/db/schemas';
import { MOVIE_COMPACT_SELECT, TV_SERIES_COMPACT_SELECT } from '@libs/db/selectors';
import { SupportedLocale } from '@libs/i18n';
import { ImportServerEvents } from '@libs/realtime';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { CursorPaginationQueryDto } from '../../../common/dto/cursor-pagination.dto';
import { BaseCursor, decodeCursor, encodeCursor } from '../../../utils/cursor';
import { RealtimeGateway } from '../../realtime/realtime.gateway';
import { User } from '../../auth/auth.service';
import { plainToInstance } from 'class-transformer';
import {
  ImportJobBookmarkDto,
  ListInfiniteImportBookmarksDto,
  ListPaginatedImportBookmarksDto,
  PatchImportJobBookmarkDto,
} from './import-bookmarks.dto';

@Injectable()
export class ImportBookmarksService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  private async getOwnedJob(userId: string, importJobId: number) {
    const job = await this.db.query.importJob.findFirst({
      where: and(eq(importJob.id, importJobId), eq(importJob.userId, userId)),
    });
    if (!job) throw new NotFoundException('Import job not found');
    return job;
  }

  private assertAwaitingReview(status: string) {
    if (status !== 'awaiting_review') {
      throw new BadRequestException('Import job is not awaiting review');
    }
  }

  private getListBaseQuery(importJobId: number) {
    return {
      whereClause: eq(importJobBookmark.importJobId, importJobId),
      orderBy: [asc(importJobBookmark.id)],
    };
  }

  // Batched equivalent of bookmarks.service.ts's getMedia() — list/patch responses need media
  // for potentially many rows at once (movies and TV series both), so a single set_config
  // transaction + two IN(...) queries replaces what would otherwise be N per-row client fetches.
  private async fetchCompactMedia(
    locale: SupportedLocale,
    movieIds: number[],
    tvSeriesIds: number[],
  ) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_language', ${locale}, true)`);

      const [movies, tvSeriesRows] = await Promise.all([
        movieIds.length
          ? tx
              .select(MOVIE_COMPACT_SELECT)
              .from(tmdbMovieView)
              .where(inArray(tmdbMovieView.id, movieIds))
          : Promise.resolve([]),
        tvSeriesIds.length
          ? tx
              .select(TV_SERIES_COMPACT_SELECT)
              .from(tmdbTvSeriesView)
              .where(inArray(tmdbTvSeriesView.id, tvSeriesIds))
          : Promise.resolve([]),
      ]);

      return {
        movies: new Map(movies.map((m) => [m.id, m])),
        tvSeries: new Map(tvSeriesRows.map((t) => [t.id, t])),
      };
    });
  }

  private async withMedia<T extends { movieId: number | null; tvSeriesId: number | null }>(
    locale: SupportedLocale,
    rows: T[],
  ) {
    const movieIds = [
      ...new Set(rows.map((row) => row.movieId).filter((id): id is number => id != null)),
    ];
    const tvSeriesIds = [
      ...new Set(rows.map((row) => row.tvSeriesId).filter((id): id is number => id != null)),
    ];
    const { movies, tvSeries } = await this.fetchCompactMedia(locale, movieIds, tvSeriesIds);

    return rows.map((row) => ({
      ...row,
      movie: row.movieId ? (movies.get(row.movieId) ?? null) : null,
      tvSeries: row.tvSeriesId ? (tvSeries.get(row.tvSeriesId) ?? null) : null,
    }));
  }

  async listAll(
    user: User,
    importJobId: number,
    locale: SupportedLocale,
  ): Promise<ImportJobBookmarkDto[]> {
    await this.getOwnedJob(user.id, importJobId);
    const { whereClause, orderBy } = this.getListBaseQuery(importJobId);

    const rows = await this.db.query.importJobBookmark.findMany({ where: whereClause, orderBy });
    const withMedia = await this.withMedia(locale, rows);
    return withMedia.map((row) => plainToInstance(ImportJobBookmarkDto, row));
  }

  async listPaginated(
    user: User,
    importJobId: number,
    query: PaginationQueryDto,
    locale: SupportedLocale,
  ): Promise<ListPaginatedImportBookmarksDto> {
    await this.getOwnedJob(user.id, importJobId);
    const { page, per_page } = query;
    const { whereClause, orderBy } = this.getListBaseQuery(importJobId);

    const [rows, totalCount] = await Promise.all([
      this.db.query.importJobBookmark.findMany({
        where: whereClause,
        orderBy,
        limit: per_page,
        offset: (page - 1) * per_page,
      }),
      this.db.$count(importJobBookmark, whereClause),
    ]);

    const withMedia = await this.withMedia(locale, rows);

    return plainToInstance(ListPaginatedImportBookmarksDto, {
      data: withMedia,
      meta: {
        total_results: totalCount,
        total_pages: Math.ceil(totalCount / per_page),
        current_page: page,
        per_page,
      },
    });
  }

  async listInfinite(
    user: User,
    importJobId: number,
    query: CursorPaginationQueryDto,
    locale: SupportedLocale,
  ): Promise<ListInfiniteImportBookmarksDto> {
    await this.getOwnedJob(user.id, importJobId);
    const { per_page, cursor, include_total_count } = query;
    const cursorData = cursor ? decodeCursor<BaseCursor<number, number>>(cursor) : null;
    const { whereClause: baseWhereClause, orderBy } = this.getListBaseQuery(importJobId);

    const finalWhereClause = cursorData
      ? and(baseWhereClause, gt(importJobBookmark.id, cursorData.id))
      : baseWhereClause;

    const rows = await this.db.query.importJobBookmark.findMany({
      where: finalWhereClause,
      orderBy,
      limit: per_page + 1,
    });

    const hasNextPage = rows.length > per_page;
    const pageRows = hasNextPage ? rows.slice(0, per_page) : rows;

    let nextCursor: string | null = null;
    if (hasNextPage) {
      const lastItem = pageRows[pageRows.length - 1];
      nextCursor = encodeCursor<BaseCursor<number, number>>({
        value: lastItem.id,
        id: lastItem.id,
      });
    }

    const totalCount =
      include_total_count && !cursorData
        ? await this.db.$count(importJobBookmark, baseWhereClause)
        : undefined;

    const withMedia = await this.withMedia(locale, pageRows);

    return plainToInstance(ListInfiniteImportBookmarksDto, {
      data: withMedia,
      meta: { next_cursor: nextCursor, per_page, total_results: totalCount },
    });
  }

  async patch(
    user: User,
    importJobId: number,
    itemId: number,
    dto: PatchImportJobBookmarkDto,
    locale: SupportedLocale,
  ): Promise<ImportJobBookmarkDto> {
    const job = await this.getOwnedJob(user.id, importJobId);
    this.assertAwaitingReview(job.status);

    const set: Partial<typeof importJobBookmark.$inferInsert> = {};
    if (dto.movieId !== undefined) {
      set.movieId = dto.movieId;
      set.tvSeriesId = null;
      set.type = 'movie';
      set.matchStatus = 'matched';
    } else if (dto.tvSeriesId !== undefined) {
      set.tvSeriesId = dto.tvSeriesId;
      set.movieId = null;
      set.type = 'tv_series';
      set.matchStatus = 'matched';
    }
    if (dto.matchStatus !== undefined) set.matchStatus = dto.matchStatus;

    const [updated] = await this.db
      .update(importJobBookmark)
      .set(set)
      .where(and(eq(importJobBookmark.id, itemId), eq(importJobBookmark.importJobId, importJobId)))
      .returning();

    if (!updated) throw new NotFoundException('Import item not found');

    const { movies, tvSeries } = await this.fetchCompactMedia(
      locale,
      updated.movieId ? [updated.movieId] : [],
      updated.tvSeriesId ? [updated.tvSeriesId] : [],
    );

    const result = plainToInstance(ImportJobBookmarkDto, {
      ...updated,
      movie: updated.movieId ? (movies.get(updated.movieId) ?? null) : null,
      tvSeries: updated.tvSeriesId ? (tvSeries.get(updated.tvSeriesId) ?? null) : null,
    });

    this.realtimeGateway.emitToUser(user.id, ImportServerEvents.BOOKMARK_PATCHED, {
      importJobId,
      item: result,
    });

    return result;
  }
}
