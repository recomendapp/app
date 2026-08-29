import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../../common/modules/drizzle/drizzle.module';
import { importJob, importJobReviewTvSeries } from '@libs/db/schemas';
import { ImportServerEvents } from '@libs/realtime';
import { RealtimeGateway } from '../../../realtime/realtime.gateway';
import { User } from '../../../auth/auth.service';
import { plainToInstance } from 'class-transformer';
import { ImportJobReviewDto, PatchImportJobReviewDto } from '../../dto/imports.dto';

@Injectable()
export class ImportLogTvSeriesReviewsService {
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

  async get(user: User, importJobId: number, itemId: number): Promise<ImportJobReviewDto | null> {
    await this.getOwnedJob(user.id, importJobId);
    const row = await this.db.query.importJobReviewTvSeries.findFirst({
      where: eq(importJobReviewTvSeries.importJobLogTvSeriesId, itemId),
      with: { importJobLogTvSeries: true },
    });
    if (!row || row.importJobLogTvSeries.importJobId !== importJobId) return null;
    return plainToInstance(ImportJobReviewDto, row);
  }

  async patch(
    user: User,
    importJobId: number,
    itemId: number,
    dto: PatchImportJobReviewDto,
  ): Promise<ImportJobReviewDto> {
    const job = await this.getOwnedJob(user.id, importJobId);
    this.assertAwaitingReview(job.status);

    const [updated] = await this.db
      .update(importJobReviewTvSeries)
      .set({ resolution: dto.resolution === 'keep_existing' ? 'keep_existing' : 'use_imported' })
      .where(eq(importJobReviewTvSeries.importJobLogTvSeriesId, itemId))
      .returning();

    if (!updated) throw new NotFoundException('Import review not found');
    const result = plainToInstance(ImportJobReviewDto, updated);

    this.realtimeGateway.emitToUser(user.id, ImportServerEvents.LOG_TV_SERIES_REVIEW_PATCHED, {
      importJobId,
      itemId,
      review: result,
    });

    return result;
  }
}
