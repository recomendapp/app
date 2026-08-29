import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional } from 'class-validator';
import { importJobStatusEnum, importResolutionEnum } from '@libs/db/schemas';
import { PaginatedResponseDto } from '../../../common/dto/pagination.dto';
import { CursorPaginatedResponseDto } from '../../../common/dto/cursor-pagination.dto';

@ApiSchema({ name: 'ImportJob' })
export class ImportJobDto {
  @ApiProperty() @Expose() id!: number;
  @ApiProperty() @Expose() userId!: string;

  @ApiProperty({ nullable: true }) @Expose() provider!: string | null;

  @ApiProperty({ enum: importJobStatusEnum.enumValues })
  @Expose()
  status!: (typeof importJobStatusEnum.enumValues)[number];

  @ApiProperty() @Expose() itemsTotal!: number;
  @ApiProperty() @Expose() itemsProcessed!: number;
  @ApiProperty() @Expose() itemsMatched!: number;
  @ApiProperty() @Expose() itemsFailed!: number;

  @ApiProperty({ nullable: true }) @Expose() error!: string | null;

  @ApiProperty() @Expose() createdAt!: string;
  @ApiProperty() @Expose() updatedAt!: string;

  constructor(data: ImportJobDto) {
    Object.assign(this, data);
  }
}

// Shared by the log-movies/reviews and log-tv-series/reviews submodules — same shape either way,
// so it stays here rather than being duplicated per entity type.
@ApiSchema({ name: 'ImportJobReview' })
export class ImportJobReviewDto {
  @ApiProperty() @Expose() id!: number;
  @ApiProperty({ nullable: true }) @Expose() title!: string | null;
  @ApiProperty() @Expose() body!: string;
  @ApiProperty() @Expose() isSpoiler!: boolean;

  @ApiProperty({ enum: importResolutionEnum.enumValues, nullable: true })
  @Expose()
  resolution!: (typeof importResolutionEnum.enumValues)[number] | null;

  constructor(data: ImportJobReviewDto) {
    Object.assign(this, data);
  }
}

@ApiSchema({ name: 'PatchImportJobReview' })
export class PatchImportJobReviewDto {
  @ApiProperty({
    enum: ['keep_existing', 'use_imported'],
    description:
      '"keep_existing" means don\'t import this review (whether or not one already exists) — reviews are free text, so unlike ratings there is no "merge"',
  })
  @IsIn(['keep_existing', 'use_imported'])
  resolution!: 'keep_existing' | 'use_imported';
}

@ApiSchema({ name: 'ListPaginatedImportJobs' })
export class ListPaginatedImportJobsDto extends PaginatedResponseDto<ImportJobDto> {
  @ApiProperty({ type: () => [ImportJobDto] })
  @Type(() => ImportJobDto)
  data!: ImportJobDto[];

  constructor(partial: Partial<ListPaginatedImportJobsDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}

@ApiSchema({ name: 'ListInfiniteImportJobs' })
export class ListInfiniteImportJobsDto extends CursorPaginatedResponseDto<ImportJobDto> {
  @ApiProperty({ type: () => [ImportJobDto] })
  @Type(() => ImportJobDto)
  data!: ImportJobDto[];

  constructor(partial: Partial<ListInfiniteImportJobsDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}

/* --------------------------- Internal (Prefect) --------------------------- */

@ApiSchema({ name: 'ImportJobInternalEvent' })
export class ImportJobInternalEventDto {
  @ApiPropertyOptional() @IsOptional() @IsInt() itemsTotal?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() itemsProcessed?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() itemsMatched?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() itemsFailed?: number;

  @ApiPropertyOptional({
    enum: ['awaiting_review', 'failed'],
    description:
      'Only these two are settable from the flow — "processing" is the implicit starting state, "completed" only happens via /validate',
  })
  @IsOptional()
  @IsIn(['awaiting_review', 'failed'])
  status?: 'awaiting_review' | 'failed';

  @ApiPropertyOptional() @IsOptional() error?: string;
}
