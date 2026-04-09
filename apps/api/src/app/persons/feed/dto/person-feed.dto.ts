import { ApiSchema, ApiProperty, ApiPropertyOptional, ApiExtraModels, IntersectionType, getSchemaPath } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsOptional, ValidateNested, IsString, IsArray } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { MovieSummaryDto } from '../../../movies/dto/movies.dto'; // Ajuste les imports
import { TvSeriesSummaryDto } from '../../../tv-series/dto/tv-series.dto';
import { PersonCompactDto } from '../../../persons/dto/persons.dto';
import { PaginatedResponseDto, PaginationQueryDto } from '../../../../common/dto/pagination.dto';
import { CursorPaginatedResponseDto, CursorPaginationQueryDto } from '../../../../common/dto/cursor-pagination.dto';
import { SortOrder } from '../../../../common/dto/sort.dto';

export enum PersonFeedSortBy {
  DATE = 'date',
}

@ApiSchema({ name: 'PersonFeed' })
export class PersonFeedDto {
  @ApiProperty({ description: 'The type of the media', example: 'movie' })
  @Expose()
  @IsString()
  type!: 'movie' | 'tv_series';

  @ApiProperty({ example: 123456 })
  @Expose()
  @IsInt()
  mediaId!: number;

  @ApiProperty({ example: '2024-01-30' })
  @Expose()
  @IsDateString()
  date!: string;

  @ApiProperty({ example: ['Director', 'Writer'] })
  @Expose()
  @IsArray()
  @IsString({ each: true })
  jobs!: string[];

  @ApiProperty({ type: () => PersonCompactDto })
  @Expose()
  @ValidateNested()
  @Type(() => PersonCompactDto)
  person!: PersonCompactDto;

  constructor(data: PersonFeedDto) {
    Object.assign(this, data);
  }
}

/* ---------------------------------- Types --------------------------------- */
@ApiSchema({ name: 'PersonFeedWithMovie' })
export class PersonFeedWithMovieDto extends PersonFeedDto {
  @ApiProperty({ enum: ['movie'] as const })
  @Expose()
  type!: 'movie';

  @ApiProperty({ type: () => MovieSummaryDto })
  @Expose()
  @ValidateNested()
  @Type(() => MovieSummaryDto)
  media!: MovieSummaryDto;
}

@ApiSchema({ name: 'PersonFeedWithTvSeries' })
export class PersonFeedWithTvSeriesDto extends PersonFeedDto {
  @ApiProperty({ enum: ['tv_series'] as const })
  @Expose()
  type!: 'tv_series';

  @ApiProperty({ type: () => TvSeriesSummaryDto })
  @Expose()
  @ValidateNested()
  @Type(() => TvSeriesSummaryDto)
  media!: TvSeriesSummaryDto;
}

export type PersonFeedUnion = PersonFeedWithMovieDto | PersonFeedWithTvSeriesDto;

/* ---------------------------------- Queries --------------------------------- */

@ApiSchema({ name: 'BaseListPersonFeedQuery' })
export class BaseListPersonFeedQueryDto {
  @ApiPropertyOptional({
    description: 'Field to sort the feed by',
    default: PersonFeedSortBy.DATE,
    enum: PersonFeedSortBy,
  })
  @IsOptional()
  @IsEnum(PersonFeedSortBy)
  sort_by: PersonFeedSortBy = PersonFeedSortBy.DATE;

  @ApiPropertyOptional({
    description: 'Sort order',
    default: SortOrder.ASC,
    enum: SortOrder,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sort_order: SortOrder = SortOrder.ASC;

  @ApiPropertyOptional({
    description: 'Minimum release/air date (YYYY-MM-DD). Defaults to 7 days ago.',
    example: '2024-03-11',
  })
  @IsOptional()
  @IsDateString()
  min_date?: string = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 7 days ago

  @ApiPropertyOptional({
    description: 'Maximum release/air date (YYYY-MM-DD).',
    example: '2025-12-31',
  })
  @IsOptional()
  @IsDateString()
  max_date?: string;
}

@ApiSchema({ name: 'ListPaginatedPersonFeedQuery' })
export class ListPaginatedPersonFeedQueryDto extends IntersectionType(
  BaseListPersonFeedQueryDto,
  PaginationQueryDto
) {}

@ApiSchema({ name: 'ListInfinitePersonFeedQuery' })
export class ListInfinitePersonFeedQueryDto extends IntersectionType(
  BaseListPersonFeedQueryDto,
  CursorPaginationQueryDto
) {}

/* ---------------------------------- Responses --------------------------------- */

@ApiExtraModels(PersonFeedWithMovieDto, PersonFeedWithTvSeriesDto)
@ApiSchema({ name: 'ListPaginatedPersonFeed' })
export class ListPaginatedPersonFeedDto extends PaginatedResponseDto<PersonFeedUnion> {
  @ApiProperty({
    type: 'array',
    items: {
      oneOf: [
        { $ref: getSchemaPath(PersonFeedWithMovieDto) },
        { $ref: getSchemaPath(PersonFeedWithTvSeriesDto) },
      ],
      discriminator: {
        propertyName: 'type',
        mapping: {
          movie: getSchemaPath(PersonFeedWithMovieDto),
          tv_series: getSchemaPath(PersonFeedWithTvSeriesDto),
        },
      },
    },
  })
  @Type(() => PersonFeedDto, {
    keepDiscriminatorProperty: true,
    discriminator: {
      property: 'type',
      subTypes: [
        { value: PersonFeedWithMovieDto, name: 'movie' },
        { value: PersonFeedWithTvSeriesDto, name: 'tv_series' },
      ],
    },
  })
  data!: PersonFeedUnion[];

  constructor(partial: Partial<ListPaginatedPersonFeedDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}

@ApiExtraModels(PersonFeedWithMovieDto, PersonFeedWithTvSeriesDto)
@ApiSchema({ name: 'ListInfinitePersonFeed'})
export class ListInfinitePersonFeedDto extends CursorPaginatedResponseDto<PersonFeedUnion> {
  @ApiProperty({
    type: 'array',
    items: {
      oneOf: [
        { $ref: getSchemaPath(PersonFeedWithMovieDto) },
        { $ref: getSchemaPath(PersonFeedWithTvSeriesDto) },
      ],
      discriminator: {
        propertyName: 'type',
        mapping: {
          movie: getSchemaPath(PersonFeedWithMovieDto),
          tv_series: getSchemaPath(PersonFeedWithTvSeriesDto),
        },
      },
    },
  })
  @Type(() => PersonFeedDto, {
    keepDiscriminatorProperty: true,
    discriminator: {
      property: 'type',
      subTypes: [
        { value: PersonFeedWithMovieDto, name: 'movie' },
        { value: PersonFeedWithTvSeriesDto, name: 'tv_series' },
      ],
    },
  })
  data!: PersonFeedUnion[];

  constructor(partial: Partial<ListInfinitePersonFeedDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}