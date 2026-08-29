import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq, gt, inArray, or, sql } from 'drizzle-orm';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../../common/modules/drizzle/drizzle.module';
import {
  importJob,
  importJobPlaylist,
  importJobPlaylistItem,
  tmdbMovieView,
  tmdbTvSeriesView,
} from '@libs/db/schemas';
import { MOVIE_COMPACT_SELECT, TV_SERIES_COMPACT_SELECT } from '@libs/db/selectors';
import { SupportedLocale } from '@libs/i18n';
import { ImportServerEvents } from '@libs/realtime';
import { PaginationQueryDto } from '../../../../common/dto/pagination.dto';
import { CursorPaginationQueryDto } from '../../../../common/dto/cursor-pagination.dto';
import { BaseCursor, decodeCursor, encodeCursor } from '../../../../utils/cursor';
import { RealtimeGateway } from '../../../realtime/realtime.gateway';
import { User } from '../../../auth/auth.service';
import { plainToInstance } from 'class-transformer';
import {
  ImportJobPlaylistItemDto,
  ListInfiniteImportPlaylistItemsDto,
  ListPaginatedImportPlaylistItemsDto,
  PatchImportJobPlaylistItemDto,
} from './import-playlist-items.dto';

@Injectable()
export class ImportPlaylistItemsService {
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

  private async getOwnedPlaylist(userId: string, importJobId: number, playlistId: number) {
    await this.getOwnedJob(userId, importJobId);
    const stagedPlaylist = await this.db.query.importJobPlaylist.findFirst({
      where: and(
        eq(importJobPlaylist.id, playlistId),
        eq(importJobPlaylist.importJobId, importJobId),
      ),
    });
    if (!stagedPlaylist) throw new NotFoundException('Import playlist not found');
    return stagedPlaylist;
  }

  private getListBaseQuery(playlistId: number) {
    return {
      whereClause: eq(importJobPlaylistItem.importJobPlaylistId, playlistId),
      orderBy: [asc(importJobPlaylistItem.sourceOrder), asc(importJobPlaylistItem.id)],
    };
  }

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
    playlistId: number,
    locale: SupportedLocale,
  ): Promise<ImportJobPlaylistItemDto[]> {
    await this.getOwnedPlaylist(user.id, importJobId, playlistId);
    const { whereClause, orderBy } = this.getListBaseQuery(playlistId);

    const rows = await this.db.query.importJobPlaylistItem.findMany({
      where: whereClause,
      orderBy,
    });
    const withMedia = await this.withMedia(locale, rows);
    return withMedia.map((row) => plainToInstance(ImportJobPlaylistItemDto, row));
  }

  async listPaginated(
    user: User,
    importJobId: number,
    playlistId: number,
    query: PaginationQueryDto,
    locale: SupportedLocale,
  ): Promise<ListPaginatedImportPlaylistItemsDto> {
    await this.getOwnedPlaylist(user.id, importJobId, playlistId);
    const { page, per_page } = query;
    const { whereClause, orderBy } = this.getListBaseQuery(playlistId);

    const [rows, totalCount] = await Promise.all([
      this.db.query.importJobPlaylistItem.findMany({
        where: whereClause,
        orderBy,
        limit: per_page,
        offset: (page - 1) * per_page,
      }),
      this.db.$count(importJobPlaylistItem, whereClause),
    ]);

    const withMedia = await this.withMedia(locale, rows);

    return plainToInstance(ListPaginatedImportPlaylistItemsDto, {
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
    playlistId: number,
    query: CursorPaginationQueryDto,
    locale: SupportedLocale,
  ): Promise<ListInfiniteImportPlaylistItemsDto> {
    await this.getOwnedPlaylist(user.id, importJobId, playlistId);
    const { per_page, cursor, include_total_count } = query;
    const cursorData = cursor ? decodeCursor<BaseCursor<number, number>>(cursor) : null;
    const { whereClause: baseWhereClause, orderBy } = this.getListBaseQuery(playlistId);

    const cursorWhereClause = cursorData
      ? or(
          gt(importJobPlaylistItem.sourceOrder, cursorData.value),
          and(
            eq(importJobPlaylistItem.sourceOrder, cursorData.value),
            gt(importJobPlaylistItem.id, cursorData.id),
          ),
        )
      : undefined;

    const finalWhereClause = cursorWhereClause
      ? and(baseWhereClause, cursorWhereClause)
      : baseWhereClause;

    const rows = await this.db.query.importJobPlaylistItem.findMany({
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
        value: lastItem.sourceOrder,
        id: lastItem.id,
      });
    }

    const totalCount =
      include_total_count && !cursorData
        ? await this.db.$count(importJobPlaylistItem, baseWhereClause)
        : undefined;

    const withMedia = await this.withMedia(locale, pageRows);

    return plainToInstance(ListInfiniteImportPlaylistItemsDto, {
      data: withMedia,
      meta: { next_cursor: nextCursor, per_page, total_results: totalCount },
    });
  }

  async patch(
    user: User,
    importJobId: number,
    playlistId: number,
    itemId: number,
    dto: PatchImportJobPlaylistItemDto,
    locale: SupportedLocale,
  ): Promise<ImportJobPlaylistItemDto> {
    const job = await this.getOwnedJob(user.id, importJobId);
    this.assertAwaitingReview(job.status);
    await this.getOwnedPlaylist(user.id, importJobId, playlistId);

    const set: Partial<typeof importJobPlaylistItem.$inferInsert> = {};
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
      .update(importJobPlaylistItem)
      .set(set)
      .where(
        and(
          eq(importJobPlaylistItem.id, itemId),
          eq(importJobPlaylistItem.importJobPlaylistId, playlistId),
        ),
      )
      .returning();

    if (!updated) throw new NotFoundException('Import item not found');

    const { movies, tvSeries } = await this.fetchCompactMedia(
      locale,
      updated.movieId ? [updated.movieId] : [],
      updated.tvSeriesId ? [updated.tvSeriesId] : [],
    );

    const result = plainToInstance(ImportJobPlaylistItemDto, {
      ...updated,
      movie: updated.movieId ? (movies.get(updated.movieId) ?? null) : null,
      tvSeries: updated.tvSeriesId ? (tvSeries.get(updated.tvSeriesId) ?? null) : null,
    });

    this.realtimeGateway.emitToUser(user.id, ImportServerEvents.PLAYLIST_ITEM_PATCHED, {
      importJobId,
      playlistId,
      item: result,
    });

    return result;
  }
}
