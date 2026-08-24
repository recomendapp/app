import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional } from 'class-validator';
import { importJobPlaylistItemTypeEnum, importMatchStatusEnum } from '@libs/db/schemas';
import { MovieCompactDto } from '../../../movies/dto/movies.dto';
import { TvSeriesCompactDto } from '../../../tv-series/dto/tv-series.dto';
import { PaginatedResponseDto } from '../../../../common/dto/pagination.dto';
import { CursorPaginatedResponseDto } from '../../../../common/dto/cursor-pagination.dto';

@ApiSchema({ name: 'ImportJobPlaylistItem' })
export class ImportJobPlaylistItemDto {
  @ApiProperty() @Expose() id!: number;
  @ApiProperty() @Expose() rawTitle!: string;
  @ApiProperty({ nullable: true }) @Expose() rawYear!: number | null;

  @ApiProperty({ enum: importJobPlaylistItemTypeEnum.enumValues })
  @Expose()
  type!: (typeof importJobPlaylistItemTypeEnum.enumValues)[number];

  @ApiProperty({ nullable: true }) @Expose() movieId!: number | null;
  @ApiProperty({ nullable: true }) @Expose() tvSeriesId!: number | null;

  @ApiProperty({ enum: importMatchStatusEnum.enumValues })
  @Expose()
  matchStatus!: (typeof importMatchStatusEnum.enumValues)[number];

  @ApiProperty() @Expose() sourceOrder!: number;

  @ApiPropertyOptional({ type: () => MovieCompactDto, nullable: true })
  @Expose()
  @Type(() => MovieCompactDto)
  movie?: MovieCompactDto | null;

  @ApiPropertyOptional({ type: () => TvSeriesCompactDto, nullable: true })
  @Expose()
  @Type(() => TvSeriesCompactDto)
  tvSeries?: TvSeriesCompactDto | null;

  constructor(data: ImportJobPlaylistItemDto) {
    Object.assign(this, data);
  }
}

@ApiSchema({ name: 'PatchImportJobPlaylistItem' })
export class PatchImportJobPlaylistItemDto {
  @ApiPropertyOptional() @IsOptional() @IsInt() movieId?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() tvSeriesId?: number;

  @ApiPropertyOptional({
    enum: ['skipped', 'unmatched'],
    description:
      '"skipped" excludes the item from validate(). "unmatched" restores a skipped item without a match — ' +
      '"matched" is never set directly, it is always server-derived from providing movieId/tvSeriesId.',
  })
  @IsOptional()
  @IsIn(['skipped', 'unmatched'])
  matchStatus?: 'skipped' | 'unmatched';
}

@ApiSchema({ name: 'ListPaginatedImportPlaylistItems' })
export class ListPaginatedImportPlaylistItemsDto extends PaginatedResponseDto<ImportJobPlaylistItemDto> {
  @ApiProperty({ type: () => [ImportJobPlaylistItemDto] })
  @Type(() => ImportJobPlaylistItemDto)
  data!: ImportJobPlaylistItemDto[];

  constructor(partial: Partial<ListPaginatedImportPlaylistItemsDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}

@ApiSchema({ name: 'ListInfiniteImportPlaylistItems' })
export class ListInfiniteImportPlaylistItemsDto extends CursorPaginatedResponseDto<ImportJobPlaylistItemDto> {
  @ApiProperty({ type: () => [ImportJobPlaylistItemDto] })
  @Type(() => ImportJobPlaylistItemDto)
  data!: ImportJobPlaylistItemDto[];

  constructor(partial: Partial<ListInfiniteImportPlaylistItemsDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}
