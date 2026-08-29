import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq, gt } from 'drizzle-orm';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle/drizzle.module';
import { importJob, importJobPlaylist } from '@libs/db/schemas';
import { ImportServerEvents } from '@libs/realtime';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { CursorPaginationQueryDto } from '../../../common/dto/cursor-pagination.dto';
import { BaseCursor, decodeCursor, encodeCursor } from '../../../utils/cursor';
import { RealtimeGateway } from '../../realtime/realtime.gateway';
import { User } from '../../auth/auth.service';
import { plainToInstance } from 'class-transformer';
import {
  ImportJobPlaylistDto,
  ListInfiniteImportPlaylistsDto,
  ListPaginatedImportPlaylistsDto,
  PatchImportJobPlaylistDto,
} from './import-playlists.dto';

@Injectable()
export class ImportPlaylistsService {
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
      whereClause: eq(importJobPlaylist.importJobId, importJobId),
      orderBy: [asc(importJobPlaylist.id)],
    };
  }

  async listAll(user: User, importJobId: number): Promise<ImportJobPlaylistDto[]> {
    await this.getOwnedJob(user.id, importJobId);
    const { whereClause, orderBy } = this.getListBaseQuery(importJobId);

    const rows = await this.db.query.importJobPlaylist.findMany({ where: whereClause, orderBy });
    return rows.map((row) => plainToInstance(ImportJobPlaylistDto, row));
  }

  async listPaginated(
    user: User,
    importJobId: number,
    query: PaginationQueryDto,
  ): Promise<ListPaginatedImportPlaylistsDto> {
    await this.getOwnedJob(user.id, importJobId);
    const { page, per_page } = query;
    const { whereClause, orderBy } = this.getListBaseQuery(importJobId);

    const [rows, totalCount] = await Promise.all([
      this.db.query.importJobPlaylist.findMany({
        where: whereClause,
        orderBy,
        limit: per_page,
        offset: (page - 1) * per_page,
      }),
      this.db.$count(importJobPlaylist, whereClause),
    ]);

    return plainToInstance(ListPaginatedImportPlaylistsDto, {
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
    importJobId: number,
    query: CursorPaginationQueryDto,
  ): Promise<ListInfiniteImportPlaylistsDto> {
    await this.getOwnedJob(user.id, importJobId);
    const { per_page, cursor, include_total_count } = query;
    const cursorData = cursor ? decodeCursor<BaseCursor<number, number>>(cursor) : null;
    const { whereClause: baseWhereClause, orderBy } = this.getListBaseQuery(importJobId);

    const finalWhereClause = cursorData
      ? and(baseWhereClause, gt(importJobPlaylist.id, cursorData.id))
      : baseWhereClause;

    const rows = await this.db.query.importJobPlaylist.findMany({
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
        ? await this.db.$count(importJobPlaylist, baseWhereClause)
        : undefined;

    return plainToInstance(ListInfiniteImportPlaylistsDto, {
      data: pageRows,
      meta: { next_cursor: nextCursor, per_page, total_results: totalCount },
    });
  }

  async patch(
    user: User,
    importJobId: number,
    itemId: number,
    dto: PatchImportJobPlaylistDto,
  ): Promise<ImportJobPlaylistDto> {
    const job = await this.getOwnedJob(user.id, importJobId);
    this.assertAwaitingReview(job.status);

    const set: Partial<typeof importJobPlaylist.$inferInsert> = {};
    if (dto.matchStatus !== undefined) set.matchStatus = dto.matchStatus;

    const [updated] = await this.db
      .update(importJobPlaylist)
      .set(set)
      .where(and(eq(importJobPlaylist.id, itemId), eq(importJobPlaylist.importJobId, importJobId)))
      .returning();

    if (!updated) throw new NotFoundException('Import item not found');

    const result = plainToInstance(ImportJobPlaylistDto, updated);

    this.realtimeGateway.emitToUser(user.id, ImportServerEvents.PLAYLIST_PATCHED, {
      importJobId,
      item: result,
    });

    return result;
  }
}
