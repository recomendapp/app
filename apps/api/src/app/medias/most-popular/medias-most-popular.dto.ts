import { ApiProperty, ApiPropertyOptional, ApiSchema, IntersectionType, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { MovieCompactDto } from '../../movies/dto/movies.dto';
import { TvSeriesCompactDto } from '../../tv-series/dto/tv-series.dto';
import { PaginatedResponseDto, PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { CursorPaginatedResponseDto, CursorPaginationQueryDto } from '../../../common/dto/cursor-pagination.dto';
import { SortOrder } from '../../../common/dto/sort.dto';

export enum MediaMostPopularSortBy {
  POPULARITY = 'popularity',
}

@ApiSchema({ name: 'MediaMostPopular' })
export class MediaMostPopularDto {
  @ApiProperty({ example: 123456 })
  @Expose()
  @IsInt()
  mediaId: number;

  @ApiProperty({
    description: 'The type of the media',
    enum: ['movie', 'tv_series'],
    example: 'movie',
  })
  @Expose()
  type: 'movie' | 'tv_series';

  @ApiProperty({ example: 85.5, description: 'TMDB popularity score' })
  @Expose()
  @IsNumber()
  popularity: number;

  constructor(data: MediaMostPopularDto) {
    Object.assign(this, data);
  }
}

@ApiSchema({ name: 'MediaMostPopularWithMovie' })
export class MediaMostPopularWithMovieDto extends MediaMostPopularDto {
  @ApiProperty({ enum: ['movie'] as const })
  @Expose()
  type: 'movie';

  @ApiProperty({ type: () => MovieCompactDto })
  @Expose()
  @ValidateNested()
  @Type(() => MovieCompactDto)
  media: MovieCompactDto;
}

@ApiSchema({ name: 'MediaMostPopularWithTvSeries' })
export class MediaMostPopularWithTvSeriesDto extends MediaMostPopularDto {
  @ApiProperty({ enum: ['tv_series'] as const })
  @Expose()
  type: 'tv_series';

  @ApiProperty({ type: () => TvSeriesCompactDto })
  @Expose()
  @ValidateNested()
  @Type(() => TvSeriesCompactDto)
  media: TvSeriesCompactDto;
}

export type MediaMostPopularWithMediaUnion = MediaMostPopularWithMovieDto | MediaMostPopularWithTvSeriesDto;

/* ---------------------------------- Queries --------------------------------- */

@ApiSchema({ name: 'BaseListMediasMostPopularQuery' })
export class BaseListMediasMostPopularQueryDto {
  @ApiPropertyOptional({
    description: 'Field to sort popular medias by',
    default: MediaMostPopularSortBy.POPULARITY,
    enum: MediaMostPopularSortBy,
  })
  @IsOptional()
  @IsEnum(MediaMostPopularSortBy)
  sort_by: MediaMostPopularSortBy = MediaMostPopularSortBy.POPULARITY;

  @ApiPropertyOptional({
    description: 'Sort order',
    default: SortOrder.DESC,
    enum: SortOrder,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sort_order: SortOrder = SortOrder.DESC;
}

@ApiSchema({ name: 'ListPaginatedMediasMostPopularQuery' })
export class ListPaginatedMediasMostPopularQueryDto extends IntersectionType(
  BaseListMediasMostPopularQueryDto,
  PaginationQueryDto
) {}

@ApiSchema({ name: 'ListInfiniteMediasMostPopularQuery' })
export class ListInfiniteMediasMostPopularQueryDto extends IntersectionType(
  BaseListMediasMostPopularQueryDto,
  CursorPaginationQueryDto
) {}

/* ---------------------------------- Responses --------------------------------- */

@ApiExtraModels(MediaMostPopularWithMovieDto, MediaMostPopularWithTvSeriesDto)
@ApiSchema({ name: 'ListPaginatedMediasMostPopular' })
export class ListPaginatedMediasMostPopularDto extends PaginatedResponseDto<MediaMostPopularWithMediaUnion> {
  @ApiProperty({
    type: 'array',
    items: {
      oneOf: [
        { $ref: getSchemaPath(MediaMostPopularWithMovieDto) },
        { $ref: getSchemaPath(MediaMostPopularWithTvSeriesDto) },
      ],
      discriminator: {
        propertyName: 'type',
        mapping: {
          movie: getSchemaPath(MediaMostPopularWithMovieDto),
          tv_series: getSchemaPath(MediaMostPopularWithTvSeriesDto),
        },
      },
    },
  })
  @Type(() => MediaMostPopularDto, {
    keepDiscriminatorProperty: true,
    discriminator: {
      property: 'type',
      subTypes: [
        { value: MediaMostPopularWithMovieDto, name: 'movie' },
        { value: MediaMostPopularWithTvSeriesDto, name: 'tv_series' },
      ],
    },
  })
  data: MediaMostPopularWithMediaUnion[];

  constructor(partial: Partial<ListPaginatedMediasMostPopularDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}

@ApiExtraModels(MediaMostPopularWithMovieDto, MediaMostPopularWithTvSeriesDto)
@ApiSchema({ name: 'ListInfiniteMediasMostPopular'})
export class ListInfiniteMediasMostPopularDto extends CursorPaginatedResponseDto<MediaMostPopularWithMediaUnion> {
  @ApiProperty({
    type: 'array',
    items: {
      oneOf: [
        { $ref: getSchemaPath(MediaMostPopularWithMovieDto) },
        { $ref: getSchemaPath(MediaMostPopularWithTvSeriesDto) },
      ],
      discriminator: {
        propertyName: 'type',
        mapping: {
          movie: getSchemaPath(MediaMostPopularWithMovieDto),
          tv_series: getSchemaPath(MediaMostPopularWithTvSeriesDto),
        },
      },
    },
  })
  @Type(() => MediaMostPopularDto, {
    keepDiscriminatorProperty: true,
    discriminator: {
      property: 'type',
      subTypes: [
        { value: MediaMostPopularWithMovieDto, name: 'movie' },
        { value: MediaMostPopularWithTvSeriesDto, name: 'tv_series' },
      ],
    },
  })
  data: MediaMostPopularWithMediaUnion[];

  constructor(partial: Partial<ListInfiniteMediasMostPopularDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}