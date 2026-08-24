import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional } from 'class-validator';
import { importMatchStatusEnum, importResolutionEnum, logTvStatusEnum } from '@libs/db/schemas';
import { ImportJobReviewDto } from '../dto/imports.dto';
import { TvSeriesCompactDto } from '../../tv-series/dto/tv-series.dto';
import { PaginatedResponseDto } from '../../../common/dto/pagination.dto';
import { CursorPaginatedResponseDto } from '../../../common/dto/cursor-pagination.dto';

@ApiSchema({ name: 'ImportJobLogTvSeries' })
export class ImportJobLogTvSeriesDto {
  @ApiProperty() @Expose() id!: number;
  @ApiProperty() @Expose() rawTitle!: string;
  @ApiProperty({ nullable: true }) @Expose() rawYear!: number | null;
  @ApiProperty({ nullable: true }) @Expose() tvSeriesId!: number | null;

  @ApiProperty({ enum: importMatchStatusEnum.enumValues })
  @Expose()
  matchStatus!: (typeof importMatchStatusEnum.enumValues)[number];

  @ApiProperty({ nullable: true }) @Expose() importedRating!: number | null;
  @ApiProperty() @Expose() importedIsLiked!: boolean;
  @ApiProperty({ enum: logTvStatusEnum.enumValues, nullable: true })
  @Expose()
  importedStatus!: (typeof logTvStatusEnum.enumValues)[number] | null;

  @ApiProperty({ enum: importResolutionEnum.enumValues, nullable: true })
  @Expose()
  resolution!: (typeof importResolutionEnum.enumValues)[number] | null;

  @ApiPropertyOptional({ type: () => ImportJobReviewDto, nullable: true })
  @Expose()
  @Type(() => ImportJobReviewDto)
  review?: ImportJobReviewDto | null;

  @ApiPropertyOptional({ type: () => TvSeriesCompactDto, nullable: true })
  @Expose()
  @Type(() => TvSeriesCompactDto)
  tvSeries?: TvSeriesCompactDto | null;

  constructor(data: ImportJobLogTvSeriesDto) {
    Object.assign(this, data);
  }
}

@ApiSchema({ name: 'PatchImportJobLogTvSeries' })
export class PatchImportJobLogTvSeriesDto {
  @ApiPropertyOptional({ description: 'Change the matched TV series' })
  @IsOptional()
  @IsInt()
  tvSeriesId?: number;

  @ApiPropertyOptional({ enum: importResolutionEnum.enumValues })
  @IsOptional()
  @IsIn(importResolutionEnum.enumValues)
  resolution?: (typeof importResolutionEnum.enumValues)[number];

  @ApiPropertyOptional({
    enum: ['skipped', 'unmatched'],
    description:
      '"skipped" excludes the item from validate(). "unmatched" restores a skipped item without a match — ' +
      '"matched" is never set directly, it is always server-derived from providing tvSeriesId.',
  })
  @IsOptional()
  @IsIn(['skipped', 'unmatched'])
  matchStatus?: 'skipped' | 'unmatched';
}

@ApiSchema({ name: 'ListPaginatedImportLogTvSeries' })
export class ListPaginatedImportLogTvSeriesDto extends PaginatedResponseDto<ImportJobLogTvSeriesDto> {
  @ApiProperty({ type: () => [ImportJobLogTvSeriesDto] })
  @Type(() => ImportJobLogTvSeriesDto)
  data!: ImportJobLogTvSeriesDto[];

  constructor(partial: Partial<ListPaginatedImportLogTvSeriesDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}

@ApiSchema({ name: 'ListInfiniteImportLogTvSeries' })
export class ListInfiniteImportLogTvSeriesDto extends CursorPaginatedResponseDto<ImportJobLogTvSeriesDto> {
  @ApiProperty({ type: () => [ImportJobLogTvSeriesDto] })
  @Type(() => ImportJobLogTvSeriesDto)
  data!: ImportJobLogTvSeriesDto[];

  constructor(partial: Partial<ListInfiniteImportLogTvSeriesDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}
