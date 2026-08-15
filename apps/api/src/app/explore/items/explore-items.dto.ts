import {
  ApiProperty,
  ApiPropertyOptional,
  ApiSchema,
  ApiExtraModels,
  IntersectionType,
  getSchemaPath,
} from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { exploreItemTypeEnum } from '@libs/db/schemas';
import { MovieCompactDto } from '../../movies/dto/movies.dto';
import { TvSeriesCompactDto } from '../../tv-series/dto/tv-series.dto';
import { PaginatedResponseDto, PaginationQueryDto } from '../../../common/dto/pagination.dto';
import {
  CursorPaginatedResponseDto,
  CursorPaginationQueryDto,
} from '../../../common/dto/cursor-pagination.dto';
import { SortOrder } from '../../../common/dto/sort.dto';

@ApiSchema({ name: 'ExploreItemLocation' })
export class ExploreItemLocationDto {
  @ApiProperty({ example: 48.8566, description: 'Latitude' })
  @Expose()
  @IsNumber()
  lat!: number;

  @ApiProperty({ example: 2.3522, description: 'Longitude' })
  @Expose()
  @IsNumber()
  lng!: number;

  constructor(data: ExploreItemLocationDto) {
    Object.assign(this, data);
  }
}

@ApiSchema({ name: 'ExploreItem' })
export class ExploreItemDto {
  @ApiProperty({ example: 42 })
  @Expose()
  @IsInt()
  id!: number;

  @ApiProperty({ example: 1 })
  @Expose()
  @IsInt()
  exploreId!: number;

  @ApiProperty({ type: () => ExploreItemLocationDto })
  @Expose()
  @ValidateNested()
  @Type(() => ExploreItemLocationDto)
  location!: ExploreItemLocationDto;

  @ApiProperty({ example: 123456 })
  @Expose()
  @IsInt()
  mediaId!: number;

  @ApiProperty({
    description: 'The type of the explore item',
    enum: exploreItemTypeEnum.enumValues,
    example: exploreItemTypeEnum.enumValues[0],
  })
  @Expose()
  @IsIn(exploreItemTypeEnum.enumValues, {
    message: `Type must be one of: ${exploreItemTypeEnum.enumValues.join(', ')}`,
  })
  type!: (typeof exploreItemTypeEnum.enumValues)[number];

  constructor(data: ExploreItemDto) {
    Object.assign(this, data);
  }
}

/* ---------------------------------- Types --------------------------------- */
@ApiSchema({ name: 'ExploreItemWithMovie' })
export class ExploreItemWithMovieDto extends ExploreItemDto {
  @ApiProperty({ enum: ['movie'] as const })
  @Expose()
  type!: 'movie';

  @ApiProperty({ type: () => MovieCompactDto })
  @Expose()
  @ValidateNested()
  @Type(() => MovieCompactDto)
  media!: MovieCompactDto;
}

@ApiSchema({ name: 'ExploreItemWithTvSeries' })
export class ExploreItemWithTvSeriesDto extends ExploreItemDto {
  @ApiProperty({ enum: ['tv_series'] as const })
  @Expose()
  type!: 'tv_series';

  @ApiProperty({ type: () => TvSeriesCompactDto })
  @Expose()
  @ValidateNested()
  @Type(() => TvSeriesCompactDto)
  media!: TvSeriesCompactDto;
}

export type ExploreItemWithMediaUnion = ExploreItemWithMovieDto | ExploreItemWithTvSeriesDto;
/* -------------------------------------------------------------------------- */

@ApiSchema({ name: 'BaseListExploreItemsQuery' })
export class BaseListExploreItemsQueryDto {
  @ApiPropertyOptional({
    description: 'Filter explore items by type',
    enum: exploreItemTypeEnum.enumValues,
  })
  @IsOptional()
  @IsIn(exploreItemTypeEnum.enumValues, {
    message: `Type must be one of: ${exploreItemTypeEnum.enumValues.join(', ')}`,
  })
  type?: (typeof exploreItemTypeEnum.enumValues)[number];

  @ApiPropertyOptional({
    description: 'Sort order (by item id)',
    default: SortOrder.ASC,
    example: SortOrder.ASC,
    enum: SortOrder,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sort_order: SortOrder = SortOrder.ASC;
}

@ApiSchema({ name: 'ListAllExploreItemsQuery' })
export class ListAllExploreItemsQueryDto extends BaseListExploreItemsQueryDto {}

@ApiSchema({ name: 'ListPaginatedExploreItemsQuery' })
export class ListPaginatedExploreItemsQueryDto extends IntersectionType(
  BaseListExploreItemsQueryDto,
  PaginationQueryDto,
) {}

@ApiSchema({ name: 'ListInfiniteExploreItemsQuery' })
export class ListInfiniteExploreItemsQueryDto extends IntersectionType(
  BaseListExploreItemsQueryDto,
  CursorPaginationQueryDto,
) {}

@ApiExtraModels(ExploreItemWithMovieDto, ExploreItemWithTvSeriesDto)
@ApiSchema({ name: 'ListPaginatedExploreItems' })
export class ListPaginatedExploreItemsDto extends PaginatedResponseDto<ExploreItemWithMediaUnion> {
  @ApiProperty({
    type: 'array',
    items: {
      oneOf: [
        { $ref: getSchemaPath(ExploreItemWithMovieDto) },
        { $ref: getSchemaPath(ExploreItemWithTvSeriesDto) },
      ],
      discriminator: {
        propertyName: 'type',
        mapping: {
          movie: getSchemaPath(ExploreItemWithMovieDto),
          tv_series: getSchemaPath(ExploreItemWithTvSeriesDto),
        },
      },
    },
  })
  @Type(() => ExploreItemDto, {
    keepDiscriminatorProperty: true,
    discriminator: {
      property: 'type',
      subTypes: [
        { value: ExploreItemWithMovieDto, name: 'movie' },
        { value: ExploreItemWithTvSeriesDto, name: 'tv_series' },
      ],
    },
  })
  data!: ExploreItemWithMediaUnion[];

  constructor(partial: Partial<ListPaginatedExploreItemsDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}

@ApiExtraModels(ExploreItemWithMovieDto, ExploreItemWithTvSeriesDto)
@ApiSchema({ name: 'ListInfiniteExploreItems' })
export class ListInfiniteExploreItemsDto extends CursorPaginatedResponseDto<ExploreItemWithMediaUnion> {
  @ApiProperty({
    type: 'array',
    items: {
      oneOf: [
        { $ref: getSchemaPath(ExploreItemWithMovieDto) },
        { $ref: getSchemaPath(ExploreItemWithTvSeriesDto) },
      ],
      discriminator: {
        propertyName: 'type',
        mapping: {
          movie: getSchemaPath(ExploreItemWithMovieDto),
          tv_series: getSchemaPath(ExploreItemWithTvSeriesDto),
        },
      },
    },
  })
  @Type(() => ExploreItemDto, {
    keepDiscriminatorProperty: true,
    discriminator: {
      property: 'type',
      subTypes: [
        { value: ExploreItemWithMovieDto, name: 'movie' },
        { value: ExploreItemWithTvSeriesDto, name: 'tv_series' },
      ],
    },
  })
  data!: ExploreItemWithMediaUnion[];

  constructor(partial: Partial<ListInfiniteExploreItemsDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}
