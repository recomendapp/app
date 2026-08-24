import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq, gt, inArray, sql } from 'drizzle-orm';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle/drizzle.module';
import { importJob, importJobLogTvSeries, tmdbTvSeriesView } from '@libs/db/schemas';
import { TV_SERIES_COMPACT_SELECT } from '@libs/db/selectors';
import { SupportedLocale } from '@libs/i18n';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { CursorPaginationQueryDto } from '../../../common/dto/cursor-pagination.dto';
import { BaseCursor, decodeCursor, encodeCursor } from '../../../utils/cursor';
import { User } from '../../auth/auth.service';
import { plainToInstance } from 'class-transformer';
import {
  ImportJobLogTvSeriesDto,
  ListInfiniteImportLogTvSeriesDto,
  ListPaginatedImportLogTvSeriesDto,
  PatchImportJobLogTvSeriesDto,
} from './import-log-tv-series.dto';

@Injectable()
export class ImportLogTvSeriesService {
  constructor(@Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService) {}

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
      whereClause: eq(importJobLogTvSeries.importJobId, importJobId),
      orderBy: [asc(importJobLogTvSeries.id)],
    };
  }

  private async fetchTvSeries(locale: SupportedLocale, tvSeriesIds: number[]) {
    const rows = await this.db.transaction(async (tx) => {
      if (!tvSeriesIds.length) return [];
      await tx.execute(sql`SELECT set_config('app.current_language', ${locale}, true)`);
      return tx
        .select(TV_SERIES_COMPACT_SELECT)
        .from(tmdbTvSeriesView)
        .where(inArray(tmdbTvSeriesView.id, tvSeriesIds));
    });
    return new Map(rows.map((t) => [t.id, t]));
  }

  private async withTvSeries<T extends { tvSeriesId: number | null }>(
    locale: SupportedLocale,
    rows: T[],
  ) {
    const tvSeriesIds = [
      ...new Set(rows.map((row) => row.tvSeriesId).filter((id): id is number => id != null)),
    ];
    const tvSeries = await this.fetchTvSeries(locale, tvSeriesIds);
    return rows.map((row) => ({
      ...row,
      tvSeries: row.tvSeriesId ? (tvSeries.get(row.tvSeriesId) ?? null) : null,
    }));
  }

  async listAll(
    user: User,
    importJobId: number,
    locale: SupportedLocale,
  ): Promise<ImportJobLogTvSeriesDto[]> {
    await this.getOwnedJob(user.id, importJobId);
    const { whereClause, orderBy } = this.getListBaseQuery(importJobId);

    const rows = await this.db.query.importJobLogTvSeries.findMany({
      where: whereClause,
      orderBy,
      with: { review: true },
    });

    const withTvSeries = await this.withTvSeries(locale, rows);
    return withTvSeries.map((row) => plainToInstance(ImportJobLogTvSeriesDto, row));
  }

  async listPaginated(
    user: User,
    importJobId: number,
    query: PaginationQueryDto,
    locale: SupportedLocale,
  ): Promise<ListPaginatedImportLogTvSeriesDto> {
    await this.getOwnedJob(user.id, importJobId);
    const { page, per_page } = query;
    const { whereClause, orderBy } = this.getListBaseQuery(importJobId);

    const [rows, totalCount] = await Promise.all([
      this.db.query.importJobLogTvSeries.findMany({
        where: whereClause,
        orderBy,
        limit: per_page,
        offset: (page - 1) * per_page,
        with: { review: true },
      }),
      this.db.$count(importJobLogTvSeries, whereClause),
    ]);

    const withTvSeries = await this.withTvSeries(locale, rows);

    return plainToInstance(ListPaginatedImportLogTvSeriesDto, {
      data: withTvSeries,
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
  ): Promise<ListInfiniteImportLogTvSeriesDto> {
    await this.getOwnedJob(user.id, importJobId);
    const { per_page, cursor, include_total_count } = query;
    const cursorData = cursor ? decodeCursor<BaseCursor<number, number>>(cursor) : null;
    const { whereClause: baseWhereClause, orderBy } = this.getListBaseQuery(importJobId);

    const finalWhereClause = cursorData
      ? and(baseWhereClause, gt(importJobLogTvSeries.id, cursorData.id))
      : baseWhereClause;

    const rows = await this.db.query.importJobLogTvSeries.findMany({
      where: finalWhereClause,
      orderBy,
      limit: per_page + 1,
      with: { review: true },
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
        ? await this.db.$count(importJobLogTvSeries, baseWhereClause)
        : undefined;

    const withTvSeries = await this.withTvSeries(locale, pageRows);

    return plainToInstance(ListInfiniteImportLogTvSeriesDto, {
      data: withTvSeries,
      meta: { next_cursor: nextCursor, per_page, total_results: totalCount },
    });
  }

  async patch(
    user: User,
    importJobId: number,
    itemId: number,
    dto: PatchImportJobLogTvSeriesDto,
    locale: SupportedLocale,
  ): Promise<ImportJobLogTvSeriesDto> {
    const job = await this.getOwnedJob(user.id, importJobId);
    this.assertAwaitingReview(job.status);

    const set: Partial<typeof importJobLogTvSeries.$inferInsert> = {};
    if (dto.tvSeriesId !== undefined) {
      set.tvSeriesId = dto.tvSeriesId;
      set.matchStatus = 'matched';
    }
    if (dto.matchStatus !== undefined) set.matchStatus = dto.matchStatus;
    if (dto.resolution !== undefined) set.resolution = dto.resolution;

    const [updated] = await this.db
      .update(importJobLogTvSeries)
      .set(set)
      .where(
        and(eq(importJobLogTvSeries.id, itemId), eq(importJobLogTvSeries.importJobId, importJobId)),
      )
      .returning();

    if (!updated) throw new NotFoundException('Import item not found');

    const tvSeries = updated.tvSeriesId
      ? (await this.fetchTvSeries(locale, [updated.tvSeriesId])).get(updated.tvSeriesId)
      : null;

    return plainToInstance(ImportJobLogTvSeriesDto, { ...updated, tvSeries: tvSeries ?? null });
  }
}
