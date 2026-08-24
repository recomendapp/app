import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq, gt, inArray, sql } from 'drizzle-orm';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle/drizzle.module';
import { importJob, importJobLogMovie, tmdbMovieView } from '@libs/db/schemas';
import { MOVIE_COMPACT_SELECT } from '@libs/db/selectors';
import { SupportedLocale } from '@libs/i18n';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { CursorPaginationQueryDto } from '../../../common/dto/cursor-pagination.dto';
import { BaseCursor, decodeCursor, encodeCursor } from '../../../utils/cursor';
import { User } from '../../auth/auth.service';
import { plainToInstance } from 'class-transformer';
import {
  ImportJobLogMovieDto,
  ListInfiniteImportLogMoviesDto,
  ListPaginatedImportLogMoviesDto,
  PatchImportJobLogMovieDto,
} from './import-log-movies.dto';

@Injectable()
export class ImportLogMoviesService {
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
      whereClause: eq(importJobLogMovie.importJobId, importJobId),
      orderBy: [asc(importJobLogMovie.id)],
    };
  }

  private async fetchMovies(locale: SupportedLocale, movieIds: number[]) {
    const movies = await this.db.transaction(async (tx) => {
      if (!movieIds.length) return [];
      await tx.execute(sql`SELECT set_config('app.current_language', ${locale}, true)`);
      return tx
        .select(MOVIE_COMPACT_SELECT)
        .from(tmdbMovieView)
        .where(inArray(tmdbMovieView.id, movieIds));
    });
    return new Map(movies.map((m) => [m.id, m]));
  }

  private async withMovies<T extends { movieId: number | null }>(
    locale: SupportedLocale,
    rows: T[],
  ) {
    const movieIds = [
      ...new Set(rows.map((row) => row.movieId).filter((id): id is number => id != null)),
    ];
    const movies = await this.fetchMovies(locale, movieIds);
    return rows.map((row) => ({
      ...row,
      movie: row.movieId ? (movies.get(row.movieId) ?? null) : null,
    }));
  }

  async listAll(
    user: User,
    importJobId: number,
    locale: SupportedLocale,
  ): Promise<ImportJobLogMovieDto[]> {
    await this.getOwnedJob(user.id, importJobId);
    const { whereClause, orderBy } = this.getListBaseQuery(importJobId);

    const rows = await this.db.query.importJobLogMovie.findMany({
      where: whereClause,
      orderBy,
      with: { review: true },
    });

    const withMovies = await this.withMovies(locale, rows);
    return withMovies.map((row) => plainToInstance(ImportJobLogMovieDto, row));
  }

  async listPaginated(
    user: User,
    importJobId: number,
    query: PaginationQueryDto,
    locale: SupportedLocale,
  ): Promise<ListPaginatedImportLogMoviesDto> {
    await this.getOwnedJob(user.id, importJobId);
    const { page, per_page } = query;
    const { whereClause, orderBy } = this.getListBaseQuery(importJobId);

    const [rows, totalCount] = await Promise.all([
      this.db.query.importJobLogMovie.findMany({
        where: whereClause,
        orderBy,
        limit: per_page,
        offset: (page - 1) * per_page,
        with: { review: true },
      }),
      this.db.$count(importJobLogMovie, whereClause),
    ]);

    const withMovies = await this.withMovies(locale, rows);

    return plainToInstance(ListPaginatedImportLogMoviesDto, {
      data: withMovies,
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
  ): Promise<ListInfiniteImportLogMoviesDto> {
    await this.getOwnedJob(user.id, importJobId);
    const { per_page, cursor, include_total_count } = query;
    const cursorData = cursor ? decodeCursor<BaseCursor<number, number>>(cursor) : null;
    const { whereClause: baseWhereClause, orderBy } = this.getListBaseQuery(importJobId);

    const finalWhereClause = cursorData
      ? and(baseWhereClause, gt(importJobLogMovie.id, cursorData.id))
      : baseWhereClause;

    const rows = await this.db.query.importJobLogMovie.findMany({
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
        ? await this.db.$count(importJobLogMovie, baseWhereClause)
        : undefined;

    const withMovies = await this.withMovies(locale, pageRows);

    return plainToInstance(ListInfiniteImportLogMoviesDto, {
      data: withMovies,
      meta: { next_cursor: nextCursor, per_page, total_results: totalCount },
    });
  }

  async patch(
    user: User,
    importJobId: number,
    itemId: number,
    dto: PatchImportJobLogMovieDto,
    locale: SupportedLocale,
  ): Promise<ImportJobLogMovieDto> {
    const job = await this.getOwnedJob(user.id, importJobId);
    this.assertAwaitingReview(job.status);

    const set: Partial<typeof importJobLogMovie.$inferInsert> = {};
    if (dto.movieId !== undefined) {
      set.movieId = dto.movieId;
      set.matchStatus = 'matched';
    }
    if (dto.matchStatus !== undefined) set.matchStatus = dto.matchStatus;
    if (dto.resolution !== undefined) set.resolution = dto.resolution;

    const [updated] = await this.db
      .update(importJobLogMovie)
      .set(set)
      .where(and(eq(importJobLogMovie.id, itemId), eq(importJobLogMovie.importJobId, importJobId)))
      .returning();

    if (!updated) throw new NotFoundException('Import item not found');

    const movie = updated.movieId
      ? (await this.fetchMovies(locale, [updated.movieId])).get(updated.movieId)
      : null;

    return plainToInstance(ImportJobLogMovieDto, { ...updated, movie: movie ?? null });
  }
}
