import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { and, desc, eq, inArray, lt, or, sql } from 'drizzle-orm';
import { MultipartFile } from '@fastify/multipart';
import { LexoRank } from 'lexorank';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DRIZZLE_SERVICE, DrizzleService } from '../../common/modules/drizzle/drizzle.module';
import { DbTransaction } from '@libs/db';
import {
  importJob,
  importJobLogMovie,
  importJobLogTvSeries,
  importJobBookmark,
  importJobPlaylist,
  logMovie,
  logMovieWatchedDate,
  logTvSeries,
  reviewMovie,
  reviewTvSeries,
  bookmark,
  playlist,
  playlistItem,
} from '@libs/db/schemas';
import { TransfersStorageService } from '../../common/modules/transfers-storage/transfers-storage.service';
import { PrefectService } from '../../common/modules/prefect/prefect.service';
import { TvLogsSyncService } from '../tv-series/logs/sync/tv-logs-sync.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { ImportServerEvents } from '@libs/realtime';
import { User } from '../auth/auth.service';
import { plainToInstance } from 'class-transformer';
import {
  ImportJobDto,
  ImportJobInternalEventDto,
  ListInfiniteImportJobsDto,
  ListPaginatedImportJobsDto,
} from './dto/imports.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { CursorPaginationQueryDto } from '../../common/dto/cursor-pagination.dto';
import { BaseCursor, decodeCursor, encodeCursor } from '../../utils/cursor';

// review_movie/review_tv_series title has a check constraint: null, or 1-100 chars.
function sanitizeReviewTitle(title: string | null): string | null {
  if (!title) return null;
  const trimmed = title.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 100);
}

// playlist.title: 1-100 chars, required.
function sanitizePlaylistTitle(title: string): string {
  const trimmed = title.trim();
  return (trimmed || 'Imported playlist').slice(0, 100);
}

@Injectable()
export class ImportsService {
  private readonly logger = new Logger(ImportsService.name);

  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
    private readonly transfersStorage: TransfersStorageService,
    private readonly prefectService: PrefectService,
    private readonly tvLogsSyncService: TvLogsSyncService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  /* ------------------------------- Helpers -------------------------------- */

  private async syncLogMovieDates(tx: DbTransaction, logMovieId: number) {
    const [aggregated] = await tx
      .select({
        watchCount: sql<number>`count(*)::integer`,
        firstWatchedAt: sql<string>`min(${logMovieWatchedDate.watchedDate})`,
        lastWatchedAt: sql<string>`max(${logMovieWatchedDate.watchedDate})`,
      })
      .from(logMovieWatchedDate)
      .where(eq(logMovieWatchedDate.logMovieId, logMovieId));

    await tx
      .update(logMovie)
      .set({
        watchCount: Number(aggregated?.watchCount || 0),
        firstWatchedAt: aggregated?.firstWatchedAt || undefined,
        lastWatchedAt: aggregated?.lastWatchedAt || undefined,
      })
      .where(eq(logMovie.id, logMovieId));
  }

  // "You watched this show" from a provider export means the whole thing, not episode 1 — but
  // log_tv_series.status only ever stores 'watching'/'dropped' in the DB; "completed" is derived
  // from episodesWatchedCount >= the show's total (see TvSeriesLogsService/TvLogsSyncService).
  // So to actually show as completed, every season/episode has to be marked watched, same as the
  // real "mark series as completed" flow (POST /tv-series/:id/log with status: 'completed') does.
  private async markTvSeriesFullyWatched(
    tx: DbTransaction,
    logTvSeriesId: number,
    tvSeriesId: number,
  ) {
    await tx.execute(sql`
      INSERT INTO log_tv_season (
        log_tv_series_id, tv_season_id, season_number, status, created_at, updated_at
      )
      SELECT ${logTvSeriesId}, id, season_number, 'watching', now(), now()
      FROM tmdb.tv_season
      WHERE tv_series_id = ${tvSeriesId} AND season_number > 0
      ON CONFLICT DO NOTHING
    `);

    await tx.execute(sql`
      INSERT INTO log_tv_episode (
        log_tv_series_id, log_tv_season_id, tv_episode_id, season_number, episode_number, watched_at, created_at, updated_at
      )
      SELECT ${logTvSeriesId}, s.id, e.id, s.season_number, e.episode_number, now(), now(), now()
      FROM tmdb.tv_episode e
      JOIN log_tv_season s ON s.tv_season_id = e.tv_season_id AND s.log_tv_series_id = ${logTvSeriesId}
      WHERE e.tv_season_id IN (SELECT id FROM tmdb.tv_season WHERE tv_series_id = ${tvSeriesId} AND season_number > 0)
      ON CONFLICT DO NOTHING
    `);
  }

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

  /* --------------------------------- CRUD ---------------------------------- */

  async create(
    user: User,
    provider: 'letterboxd' | 'senscritique' | 'recomend',
    file: MultipartFile,
  ): Promise<ImportJobDto> {
    // One active import at a time per user — avoids piling up concurrent Prefect runs (and
    // Postgres load) for the same person mashing "import", and avoids two runs racing to
    // write the same staging rows. Check-then-insert, not airtight under a true race, but
    // good enough for a user-facing "you already have one running" guard.
    const activeJob = await this.db.query.importJob.findFirst({
      where: and(
        eq(importJob.userId, user.id),
        inArray(importJob.status, ['pending', 'processing', 'awaiting_review']),
      ),
    });
    if (activeJob) {
      throw new BadRequestException(
        'You already have an import in progress. Finish or delete it before starting a new one.',
      );
    }

    const [created] = await this.db
      .insert(importJob)
      .values({ userId: user.id, provider, direction: 'import', status: 'pending' })
      .returning();

    const { key } = await this.transfersStorage.uploadImportFile(user.id, created.id, file);

    const [updated] = await this.db
      .update(importJob)
      .set({ fileKey: key, status: 'processing' })
      .where(eq(importJob.id, created.id))
      .returning();

    const createdDto = plainToInstance(ImportJobDto, updated);
    this.realtimeGateway.emitToUser(user.id, ImportServerEvents.CREATED, createdDto);

    this.prefectService
      .triggerImportFlow({ importId: created.id, userId: user.id, s3Key: key, provider })
      .catch(async (err) => {
        this.logger.error(`Failed to trigger Prefect flow for import ${created.id}`, err);
        await this.db
          .update(importJob)
          .set({ status: 'failed', error: 'Failed to start processing' })
          .where(eq(importJob.id, created.id));
        this.realtimeGateway.emitToUser(user.id, ImportServerEvents.FAILED, {
          importId: created.id,
          error: 'Failed to start processing',
        });
      });

    return createdDto;
  }

  private getListBaseQuery(userId: string) {
    return {
      whereClause: eq(importJob.userId, userId),
      orderBy: [desc(importJob.createdAt), desc(importJob.id)],
    };
  }

  async listAll(user: User): Promise<ImportJobDto[]> {
    const { whereClause, orderBy } = this.getListBaseQuery(user.id);
    const rows = await this.db.query.importJob.findMany({ where: whereClause, orderBy });
    return rows.map((row) => plainToInstance(ImportJobDto, row));
  }

  async listPaginated(user: User, query: PaginationQueryDto): Promise<ListPaginatedImportJobsDto> {
    const { page, per_page } = query;
    const { whereClause, orderBy } = this.getListBaseQuery(user.id);

    const [rows, totalCount] = await Promise.all([
      this.db.query.importJob.findMany({
        where: whereClause,
        orderBy,
        limit: per_page,
        offset: (page - 1) * per_page,
      }),
      this.db.$count(importJob, whereClause),
    ]);

    return plainToInstance(ListPaginatedImportJobsDto, {
      data: rows,
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
    query: CursorPaginationQueryDto,
  ): Promise<ListInfiniteImportJobsDto> {
    const { per_page, cursor, include_total_count } = query;
    const cursorData = cursor ? decodeCursor<BaseCursor<string, number>>(cursor) : null;
    const { whereClause: baseWhereClause, orderBy } = this.getListBaseQuery(user.id);

    const cursorWhereClause = cursorData
      ? or(
          lt(importJob.createdAt, cursorData.value),
          and(eq(importJob.createdAt, cursorData.value), lt(importJob.id, cursorData.id)),
        )
      : undefined;

    const finalWhereClause = cursorWhereClause
      ? and(baseWhereClause, cursorWhereClause)
      : baseWhereClause;

    const rows = await this.db.query.importJob.findMany({
      where: finalWhereClause,
      orderBy,
      limit: per_page + 1,
    });

    const hasNextPage = rows.length > per_page;
    const pageRows = hasNextPage ? rows.slice(0, per_page) : rows;

    let nextCursor: string | null = null;
    if (hasNextPage) {
      const lastItem = pageRows[pageRows.length - 1];
      nextCursor = encodeCursor<BaseCursor<string, number>>({
        value: lastItem.createdAt,
        id: lastItem.id,
      });
    }

    const totalCount =
      include_total_count && !cursorData
        ? await this.db.$count(importJob, baseWhereClause)
        : undefined;

    return plainToInstance(ListInfiniteImportJobsDto, {
      data: pageRows,
      meta: { next_cursor: nextCursor, per_page, total_results: totalCount },
    });
  }

  async getById(user: User, importJobId: number): Promise<ImportJobDto> {
    const job = await this.getOwnedJob(user.id, importJobId);
    return plainToInstance(ImportJobDto, job);
  }

  async delete(user: User, importJobId: number): Promise<void> {
    const job = await this.getOwnedJob(user.id, importJobId);
    await this.db.delete(importJob).where(eq(importJob.id, importJobId));
    if (job.fileKey) {
      this.transfersStorage
        .deleteFile(job.fileKey)
        .catch((err) => this.logger.error(`Failed to delete import file ${job.fileKey}`, err));
    }
    this.realtimeGateway.emitToUser(user.id, ImportServerEvents.DELETED, {
      importId: importJobId,
      userId: user.id,
    });
  }

  /* --------------------------------- Validate -------------------------------- */

  async validate(user: User, importJobId: number): Promise<ImportJobDto> {
    const result = await this.db.transaction(async (tx) => {
      const job = await tx.query.importJob.findFirst({
        where: and(eq(importJob.id, importJobId), eq(importJob.userId, user.id)),
      });
      if (!job) throw new NotFoundException('Import job not found');
      this.assertAwaitingReview(job.status);

      const stagedLogMovies = await tx.query.importJobLogMovie.findMany({
        where: eq(importJobLogMovie.importJobId, importJobId),
        with: { watchedDates: true, review: true },
      });

      for (const staged of stagedLogMovies) {
        if (staged.matchStatus === 'skipped' || !staged.movieId) continue;

        let logMovieId: number;

        // Conflict detection must be re-checked live, in this same transaction — the staging
        // row's existingLogMovieId/existingRating/existingIsLiked are a snapshot from whenever
        // the Prefect flow analyzed the file, which can be long before the user actually hits
        // "validate". If they logged this movie themselves in the meantime, trusting the stale
        // snapshot would either insert a duplicate logMovie row or silently clobber a rating the
        // staging pass never saw.
        const [existingLog] = await tx
          .select({ id: logMovie.id, rating: logMovie.rating, isLiked: logMovie.isLiked })
          .from(logMovie)
          .where(and(eq(logMovie.userId, user.id), eq(logMovie.movieId, staged.movieId)))
          .limit(1);

        if (existingLog) {
          const resolution = staged.resolution ?? 'keep_existing';
          const set: Partial<typeof logMovie.$inferInsert> = {};

          const shouldUseImportedRating =
            staged.importedRating != null &&
            (resolution === 'use_imported' ||
              (resolution === 'merge' && existingLog.rating == null));
          if (shouldUseImportedRating) {
            set.rating = staged.importedRating;
            set.ratedAt = sql`now()` as unknown as string;
          }

          // Never unset a like the user already has — only add one.
          if (staged.importedIsLiked && !existingLog.isLiked) {
            set.isLiked = true;
            set.likedAt = sql`now()` as unknown as string;
          }

          if (Object.keys(set).length > 0) {
            await tx.update(logMovie).set(set).where(eq(logMovie.id, existingLog.id));
          }
          logMovieId = existingLog.id;
        } else {
          const [inserted] = await tx
            .insert(logMovie)
            .values({
              movieId: staged.movieId,
              userId: user.id,
              rating: staged.importedRating,
              ratedAt:
                staged.importedRating != null ? (sql`now()` as unknown as string) : undefined,
              isLiked: staged.importedIsLiked,
              likedAt: staged.importedIsLiked ? (sql`now()` as unknown as string) : undefined,
            })
            .returning();
          logMovieId = inserted.id;
        }

        const newWatchedDates = staged.watchedDates.filter((d) => !d.isDuplicate);
        if (newWatchedDates.length > 0) {
          await tx.insert(logMovieWatchedDate).values(
            newWatchedDates.map((d) => ({
              logMovieId,
              watchedDate: new Date(d.watchedDate),
              format: d.format ?? 'theater',
              comment: d.comment,
            })),
          );
          await this.syncLogMovieDates(tx, logMovieId);
        }

        if (staged.review) {
          // Same reasoning: check whether a review exists on this (now-resolved) logMovieId
          // right now, rather than trusting the staged existingReviewExists snapshot.
          const [existingReview] = await tx
            .select({ id: reviewMovie.id })
            .from(reviewMovie)
            .where(eq(reviewMovie.id, logMovieId))
            .limit(1);
          const resolution =
            staged.review.resolution ?? (existingReview ? 'keep_existing' : 'use_imported');
          if (resolution === 'use_imported') {
            await tx
              .insert(reviewMovie)
              .values({
                id: logMovieId,
                title: sanitizeReviewTitle(staged.review.title),
                body: staged.review.body,
                isSpoiler: staged.review.isSpoiler,
              })
              .onConflictDoUpdate({
                target: reviewMovie.id,
                set: {
                  title: sanitizeReviewTitle(staged.review.title),
                  body: staged.review.body,
                  isSpoiler: staged.review.isSpoiler,
                },
              });
          }
        }
      }

      const stagedLogTvSeries = await tx.query.importJobLogTvSeries.findMany({
        where: eq(importJobLogTvSeries.importJobId, importJobId),
        with: { review: true },
      });

      for (const staged of stagedLogTvSeries) {
        if (staged.matchStatus === 'skipped' || !staged.tvSeriesId) continue;

        let logTvSeriesId: number;

        // Same live-recheck reasoning as log-movies above.
        const [existingLog] = await tx
          .select({ id: logTvSeries.id, rating: logTvSeries.rating, isLiked: logTvSeries.isLiked })
          .from(logTvSeries)
          .where(
            and(eq(logTvSeries.userId, user.id), eq(logTvSeries.tvSeriesId, staged.tvSeriesId)),
          )
          .limit(1);

        if (existingLog) {
          const resolution = staged.resolution ?? 'keep_existing';
          const set: Partial<typeof logTvSeries.$inferInsert> = {};

          const shouldUseImportedRating =
            staged.importedRating != null &&
            (resolution === 'use_imported' ||
              (resolution === 'merge' && existingLog.rating == null));
          if (shouldUseImportedRating) {
            set.rating = staged.importedRating;
            set.ratedAt = sql`now()` as unknown as string;
          }

          if (staged.importedIsLiked && !existingLog.isLiked) {
            set.isLiked = true;
            set.likedAt = sql`now()` as unknown as string;
          }

          if (Object.keys(set).length > 0) {
            await tx.update(logTvSeries).set(set).where(eq(logTvSeries.id, existingLog.id));
          }
          logTvSeriesId = existingLog.id;
        } else {
          const [inserted] = await tx
            .insert(logTvSeries)
            .values({
              tvSeriesId: staged.tvSeriesId,
              userId: user.id,
              rating: staged.importedRating,
              ratedAt:
                staged.importedRating != null ? (sql`now()` as unknown as string) : undefined,
              isLiked: staged.importedIsLiked,
              likedAt: staged.importedIsLiked ? (sql`now()` as unknown as string) : undefined,
              status: staged.importedStatus ?? 'watching',
            })
            .returning();
          logTvSeriesId = inserted.id;
        }

        // A provider export saying "watched" means the whole show — mark every season/episode
        // watched and resync so it actually renders as completed, not "watching, 0 episodes".
        // An explicit 'dropped' status is left alone (no episodes marked, no completed derivation).
        if (staged.importedStatus !== 'dropped') {
          await this.markTvSeriesFullyWatched(tx, logTvSeriesId, staged.tvSeriesId);
          await this.tvLogsSyncService.syncTree(tx, user.id, staged.tvSeriesId);
        }

        if (staged.review) {
          const [existingReview] = await tx
            .select({ id: reviewTvSeries.id })
            .from(reviewTvSeries)
            .where(eq(reviewTvSeries.id, logTvSeriesId))
            .limit(1);
          const resolution =
            staged.review.resolution ?? (existingReview ? 'keep_existing' : 'use_imported');
          if (resolution === 'use_imported') {
            await tx
              .insert(reviewTvSeries)
              .values({
                id: logTvSeriesId,
                title: sanitizeReviewTitle(staged.review.title),
                body: staged.review.body,
                isSpoiler: staged.review.isSpoiler,
              })
              .onConflictDoUpdate({
                target: reviewTvSeries.id,
                set: {
                  title: sanitizeReviewTitle(staged.review.title),
                  body: staged.review.body,
                  isSpoiler: staged.review.isSpoiler,
                },
              });
          }
        }
      }

      const stagedBookmarks = await tx.query.importJobBookmark.findMany({
        where: eq(importJobBookmark.importJobId, importJobId),
      });

      for (const staged of stagedBookmarks) {
        if (staged.matchStatus === 'skipped') continue;
        if (!staged.movieId && !staged.tvSeriesId) continue;

        // Already-active bookmark for this movie/series = no-op (not a conflict, see design doc).
        await tx
          .insert(bookmark)
          .values({
            userId: user.id,
            type: staged.type,
            movieId: staged.movieId,
            tvSeriesId: staged.tvSeriesId,
            status: 'active',
          })
          .onConflictDoNothing();
      }

      const stagedPlaylists = await tx.query.importJobPlaylist.findMany({
        where: eq(importJobPlaylist.importJobId, importJobId),
        with: { items: { orderBy: (t, { asc }) => [asc(t.sourceOrder)] } },
      });

      // Always additive: an imported list creates a brand new playlist, never merges into
      // an existing one (see design discussion — fuzzy name-matching would be too fragile).
      for (const stagedPlaylist of stagedPlaylists) {
        if (stagedPlaylist.matchStatus === 'skipped') continue;

        const matchedItems = stagedPlaylist.items.filter(
          (item) => item.matchStatus !== 'skipped' && (item.movieId || item.tvSeriesId),
        );
        if (matchedItems.length === 0) continue;

        const [createdPlaylist] = await tx
          .insert(playlist)
          .values({
            userId: user.id,
            title: sanitizePlaylistTitle(stagedPlaylist.title),
            description: stagedPlaylist.description?.trim().slice(0, 300) || null,
            visibility: 'private',
          })
          .returning();

        let rank = LexoRank.middle();
        const itemRows = matchedItems.map((item, index) => {
          if (index > 0) rank = rank.genNext();
          return {
            playlistId: createdPlaylist.id,
            userId: user.id,
            type: item.type,
            movieId: item.movieId,
            tvSeriesId: item.tvSeriesId,
            rank: rank.toString(),
          };
        });

        await tx.insert(playlistItem).values(itemRows);
      }

      const [completed] = await tx
        .update(importJob)
        .set({ status: 'completed' })
        .where(eq(importJob.id, importJobId))
        .returning();

      return completed;
    });

    const dto = plainToInstance(ImportJobDto, result);
    // Real logMovie/logTvSeries/bookmark/playlist rows were just written outside the normal
    // domain write paths (raw Drizzle inserts above), so their own realtime events never fired —
    // this tells every connected client (any device, whether or not the import modal is open)
    // to go refetch the collections an import can touch.
    this.realtimeGateway.emitToUser(user.id, ImportServerEvents.VALIDATED, dto);
    return dto;
  }

  /* ------------------------------ Internal (Prefect) ------------------------- */

  async recordEvent(importJobId: number, dto: ImportJobInternalEventDto): Promise<void> {
    const job = await this.db.query.importJob.findFirst({
      where: eq(importJob.id, importJobId),
    });
    if (!job) throw new NotFoundException('Import job not found');

    const set: Partial<typeof importJob.$inferInsert> = {};
    if (dto.itemsTotal !== undefined) set.itemsTotal = dto.itemsTotal;
    if (dto.itemsProcessed !== undefined) set.itemsProcessed = dto.itemsProcessed;
    if (dto.itemsMatched !== undefined) set.itemsMatched = dto.itemsMatched;
    if (dto.itemsFailed !== undefined) set.itemsFailed = dto.itemsFailed;
    if (dto.status !== undefined) set.status = dto.status;
    if (dto.error !== undefined) set.error = dto.error;

    const [updated] = await this.db
      .update(importJob)
      .set(set)
      .where(eq(importJob.id, importJobId))
      .returning();

    // STAGED here means "the Prefect flow run finished staging the data" (job is now
    // awaiting_review) — distinct from ImportServerEvents.VALIDATED, which fires from
    // validate() once the user reviews and the real rows are written.
    const event =
      dto.status === 'failed'
        ? ImportServerEvents.FAILED
        : dto.status === 'awaiting_review'
          ? ImportServerEvents.STAGED
          : ImportServerEvents.PROGRESS;

    this.realtimeGateway.emitToUser(job.userId, event, plainToInstance(ImportJobDto, updated));
  }

  /* --------------------------------- Cleanup --------------------------------- */

  // Retention: `completed` jobs are just an audit trail once validated (7d), `awaiting_review`
  // jobs represent real unfinished user work so they get longer (30d), `failed` jobs stick
  // around briefly so the user can see the error (14d). Staging rows cascade with the job.
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupOldImportJobs(): Promise<void> {
    const toDelete = await this.db
      .select({ id: importJob.id, fileKey: importJob.fileKey })
      .from(importJob)
      .where(
        or(
          and(
            eq(importJob.status, 'completed'),
            sql`${importJob.updatedAt} < now() - interval '7 days'`,
          ),
          and(
            eq(importJob.status, 'awaiting_review'),
            sql`${importJob.updatedAt} < now() - interval '30 days'`,
          ),
          and(
            eq(importJob.status, 'failed'),
            sql`${importJob.updatedAt} < now() - interval '14 days'`,
          ),
        ),
      );

    if (toDelete.length === 0) return;

    await this.db.delete(importJob).where(
      inArray(
        importJob.id,
        toDelete.map((j) => j.id),
      ),
    );

    for (const job of toDelete) {
      if (job.fileKey) {
        this.transfersStorage
          .deleteFile(job.fileKey)
          .catch((err) =>
            this.logger.error(`Failed to delete import file ${job.fileKey} during cleanup`, err),
          );
      }
    }

    this.logger.log(`Cleaned up ${toDelete.length} old import job(s)`);
  }
}
