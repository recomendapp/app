import { ApiProperty, ApiPropertyOptional, ApiSchema, IntersectionType, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, ValidateNested } from 'class-validator';
import { recoTypeEnum } from '@libs/db/schemas';
import { MovieSummaryDto } from '../../movies/dto/movies.dto'; // <-- Ajuste les imports
import { TvSeriesSummaryDto } from '../../tv-series/dto/tv-series.dto';
import { PaginatedResponseDto, PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { CursorPaginatedResponseDto, CursorPaginationQueryDto } from '../../../common/dto/cursor-pagination.dto';
import { SortOrder } from '../../../common/dto/sort.dto';

export enum RecoTrendingSortBy {
  RECOMMENDATION_COUNT = 'recommendation_count',
}

@ApiSchema({ name: 'RecoTrending' })
export class RecoTrendingDto {
  @ApiProperty({ example: 123456 })
  @Expose()
  @IsInt()
  mediaId: number;

  @ApiProperty({
    description: 'The type of the media',
    enum: recoTypeEnum.enumValues,
    example: 'movie',
  })
  @Expose()
  type: typeof recoTypeEnum.enumValues[number];

  @ApiProperty({ example: 42, description: 'Number of times this media was recommended' })
  @Expose()
  @IsInt()
  recommendationCount: number;

  constructor(data: RecoTrendingDto) {
    Object.assign(this, data);
  }
}

@ApiSchema({ name: 'RecoTrendingWithMovie' })
export class RecoTrendingWithMovieDto extends RecoTrendingDto {
  @ApiProperty({ enum: ['movie'] as const })
  @Expose()
  type: 'movie';

  @ApiProperty({ type: () => MovieSummaryDto })
  @Expose()
  @ValidateNested()
  @Type(() => MovieSummaryDto)
  media: MovieSummaryDto;
}

@ApiSchema({ name: 'RecoTrendingWithTvSeries' })
export class RecoTrendingWithTvSeriesDto extends RecoTrendingDto {
  @ApiProperty({ enum: ['tv_series'] as const })
  @Expose()
  type: 'tv_series';

  @ApiProperty({ type: () => TvSeriesSummaryDto })
  @Expose()
  @ValidateNested()
  @Type(() => TvSeriesSummaryDto)
  media: TvSeriesSummaryDto;
}

export type RecoTrendingWithMediaUnion = RecoTrendingWithMovieDto | RecoTrendingWithTvSeriesDto;

/* ---------------------------------- Queries --------------------------------- */

@ApiSchema({ name: 'BaseListRecosTrendingQuery' })
export class BaseListRecosTrendingQueryDto {
  @ApiPropertyOptional({
    description: 'Field to sort trending recos by',
    default: RecoTrendingSortBy.RECOMMENDATION_COUNT,
    enum: RecoTrendingSortBy,
  })
  @IsOptional()
  @IsEnum(RecoTrendingSortBy)
  sort_by: RecoTrendingSortBy = RecoTrendingSortBy.RECOMMENDATION_COUNT;

  @ApiPropertyOptional({
    description: 'Sort order',
    default: SortOrder.DESC,
    enum: SortOrder,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sort_order: SortOrder = SortOrder.DESC;
}

@ApiSchema({ name: 'ListPaginatedRecosTrendingQuery' })
export class ListPaginatedRecosTrendingQueryDto extends IntersectionType(
  BaseListRecosTrendingQueryDto,
  PaginationQueryDto
) {}

@ApiSchema({ name: 'ListInfiniteRecosTrendingQuery' })
export class ListInfiniteRecosTrendingQueryDto extends IntersectionType(
  BaseListRecosTrendingQueryDto,
  CursorPaginationQueryDto
) {}

/* ---------------------------------- Responses --------------------------------- */

@ApiExtraModels(RecoTrendingWithMovieDto, RecoTrendingWithTvSeriesDto)
@ApiSchema({ name: 'ListPaginatedRecosTrending' })
export class ListPaginatedRecosTrendingDto extends PaginatedResponseDto<RecoTrendingWithMediaUnion> {
  @ApiProperty({
    type: 'array',
    items: {
      oneOf: [
        { $ref: getSchemaPath(RecoTrendingWithMovieDto) },
        { $ref: getSchemaPath(RecoTrendingWithTvSeriesDto) },
      ],
      discriminator: {
        propertyName: 'type',
        mapping: {
          movie: getSchemaPath(RecoTrendingWithMovieDto),
          tv_series: getSchemaPath(RecoTrendingWithTvSeriesDto),
        },
      },
    },
  })
  @Type(() => RecoTrendingDto, {
    keepDiscriminatorProperty: true,
    discriminator: {
      property: 'type',
      subTypes: [
        { value: RecoTrendingWithMovieDto, name: 'movie' },
        { value: RecoTrendingWithTvSeriesDto, name: 'tv_series' },
      ],
    },
  })
  data: RecoTrendingWithMediaUnion[];

  constructor(partial: Partial<ListPaginatedRecosTrendingDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}

@ApiExtraModels(RecoTrendingWithMovieDto, RecoTrendingWithTvSeriesDto)
@ApiSchema({ name: 'ListInfiniteRecosTrending'})
export class ListInfiniteRecosTrendingDto extends CursorPaginatedResponseDto<RecoTrendingWithMediaUnion> {
  @ApiProperty({
    type: 'array',
    items: {
      oneOf: [
        { $ref: getSchemaPath(RecoTrendingWithMovieDto) },
        { $ref: getSchemaPath(RecoTrendingWithTvSeriesDto) },
      ],
      discriminator: {
        propertyName: 'type',
        mapping: {
          movie: getSchemaPath(RecoTrendingWithMovieDto),
          tv_series: getSchemaPath(RecoTrendingWithTvSeriesDto),
        },
      },
    },
  })
  @Type(() => RecoTrendingDto, {
    keepDiscriminatorProperty: true,
    discriminator: {
      property: 'type',
      subTypes: [
        { value: RecoTrendingWithMovieDto, name: 'movie' },
        { value: RecoTrendingWithTvSeriesDto, name: 'tv_series' },
      ],
    },
  })
  data: RecoTrendingWithMediaUnion[];

  constructor(partial: Partial<ListInfiniteRecosTrendingDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}