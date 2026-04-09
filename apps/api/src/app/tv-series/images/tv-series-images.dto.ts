import { ApiProperty, ApiPropertyOptional, ApiSchema, IntersectionType } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { PaginatedResponseDto, PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { CursorPaginatedResponseDto, CursorPaginationQueryDto } from '../../../common/dto/cursor-pagination.dto';

export enum TvSeriesImageType {
  POSTER = 'poster',
  BACKDROP = 'backdrop',
  LOGO = 'logo',
}

@ApiSchema({ name: 'TvSeriesImage' })
export class TvSeriesImageDto {
  @ApiProperty({ example: 12345 })
  @Expose()
  @IsInt()
  id!: number;

  @ApiProperty({ example: '/path/to/image.jpg' })
  @Expose()
  @IsString()
  filePath!: string;

  @ApiProperty({ enum: TvSeriesImageType, example: TvSeriesImageType.POSTER })
  @Expose()
  @IsEnum(TvSeriesImageType)
  type!: string;

  @ApiProperty({ example: 1.778 })
  @Expose()
  aspectRatio!: number;

  @ApiProperty({ example: 1080 })
  @Expose()
  height!: number;

  @ApiProperty({ example: 1920 })
  @Expose()
  width!: number;

  @ApiProperty({ example: 8.5 })
  @Expose()
  voteAverage!: number;

  @ApiProperty({ example: 120 })
  @Expose()
  voteCount!: number;

  @ApiProperty({ example: 'en', nullable: true })
  @Expose()
  iso6391!: string | null;
}

export class BaseTvSeriesImagesQueryDto {
  @ApiPropertyOptional({ enum: TvSeriesImageType, description: 'Filter by image type' })
  @IsOptional()
  @IsEnum(TvSeriesImageType)
  type?: TvSeriesImageType;
}

@ApiSchema({ name: 'ListPaginatedTvSeriesImagesQuery' })
export class ListPaginatedTvSeriesImagesQueryDto extends IntersectionType(
  BaseTvSeriesImagesQueryDto,
  PaginationQueryDto
) {}

@ApiSchema({ name: 'ListInfiniteTvSeriesImagesQuery' })
export class ListInfiniteTvSeriesImagesQueryDto extends IntersectionType(
  BaseTvSeriesImagesQueryDto,
  CursorPaginationQueryDto
) {}

@ApiSchema({ name: 'ListPaginatedTvSeriesImages' })
export class ListPaginatedTvSeriesImagesDto extends PaginatedResponseDto<TvSeriesImageDto> {
  @ApiProperty({ type: () => [TvSeriesImageDto] })
  @Type(() => TvSeriesImageDto)
  data!: TvSeriesImageDto[];

  constructor(partial: Partial<ListPaginatedTvSeriesImagesDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}

@ApiSchema({ name: 'ListInfiniteTvSeriesImages' })
export class ListInfiniteTvSeriesImagesDto extends CursorPaginatedResponseDto<TvSeriesImageDto> {
  @ApiProperty({ type: () => [TvSeriesImageDto] })
  @Type(() => TvSeriesImageDto)
  data!: TvSeriesImageDto[];

  constructor(partial: Partial<ListInfiniteTvSeriesImagesDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}