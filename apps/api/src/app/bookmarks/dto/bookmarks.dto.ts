import { ApiSchema, ApiProperty, PartialType, PickType, getSchemaPath, ApiPropertyOptional, ApiExtraModels, IntersectionType } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsIn, IsInt, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { bookmarkStatusEnum, bookmarkTypeEnum } from '@libs/db/schemas';
import { MovieCompactDto } from '../../movies/dto/movies.dto';
import { TvSeriesCompactDto } from '../../tv-series/dto/tv-series.dto';
import { PaginatedResponseDto, PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { SortOrder } from '../../../common/dto/sort.dto';
import { CursorPaginatedResponseDto, CursorPaginationQueryDto } from '../../../common/dto/cursor-pagination.dto';

export enum BookmarkSortBy {
  CREATED_AT = 'created_at',
  UPDATED_AT = 'updated_at',
  RANDOM = 'random',
}

export enum BookmarkType {
  MOVIE = 'movie',
  TV_SERIES = 'tv_series',
}

@ApiSchema({ name: 'Bookmark' })
export class BookmarkDto {
  @ApiProperty({ example: 42 })
  @Expose()
  @IsInt()
  id!: number;

  @ApiProperty({ example: 'user-uuid-123' })
  @Expose()
  userId!: string;

  @ApiProperty({ example: 'Must watch this weekend', nullable: true, maxLength: 180 })
  @Expose()
  @IsOptional()
  @IsString()
  @MaxLength(180)
  comment!: string | null;

  @ApiProperty({
      description: 'The status of the bookmark',
      enum: bookmarkStatusEnum.enumValues, 
      example: bookmarkStatusEnum.enumValues[0],
  })
  @Expose()
  @IsString()
  @IsIn(bookmarkStatusEnum.enumValues, {
      message: `Status must be one of: ${bookmarkStatusEnum.enumValues.join(', ')}`
  })
  status!: typeof bookmarkStatusEnum.enumValues[number];

  @ApiProperty({ example: 123456 })
  @Expose()
  @IsInt()
  mediaId!: number;

  @ApiProperty({
      description: 'The type of the bookmark',
      enum: bookmarkTypeEnum.enumValues, 
      example: bookmarkTypeEnum.enumValues[0],
  })
  @Expose()
  @IsString()
  @IsIn(bookmarkTypeEnum.enumValues, {
      message: `Type must be one of: ${bookmarkTypeEnum.enumValues.join(', ')}`
  })
  type!: typeof bookmarkTypeEnum.enumValues[number];

  @ApiProperty({ example: '2024-01-30T12:00:00Z' })
  @Expose()
  @IsDateString()
  createdAt!: string;

  @ApiProperty({ example: '2024-01-30T12:00:00Z' })
  @Expose()
  @IsDateString()
  updatedAt!: string;

  constructor(data: BookmarkDto) {
    Object.assign(this, data);
  }
}

/* ---------------------------------- Types --------------------------------- */
@ApiSchema({ name: 'BookmarkWithMovie' })
export class BookmarkWithMovieDto extends BookmarkDto {
  @ApiProperty({ enum: ['movie'] as const })
  @Expose()
  type!: 'movie';

  @ApiProperty({ type: () => MovieCompactDto })
  @Expose()
  @ValidateNested()
  @Type(() => MovieCompactDto)
  media!: MovieCompactDto;
}

@ApiSchema({ name: 'BookmarkWithTvSeries' })
export class BookmarkWithTvSeriesDto extends BookmarkDto {
  @ApiProperty({ enum: ['tv_series'] as const })
  @Expose()
  type!: 'tv_series';

  @ApiProperty({ type: () => TvSeriesCompactDto })
  @Expose()
  @ValidateNested()
  @Type(() => TvSeriesCompactDto)
  media!: TvSeriesCompactDto;
}

export type BookmarkWithMediaUnion = BookmarkWithMovieDto | BookmarkWithTvSeriesDto;
/* -------------------------------------------------------------------------- */

@ApiSchema({ name: 'BookmarkInput' })
export class BookmarkInputDto extends PartialType(PickType(BookmarkDto, ['comment'] as const)) {}

@ApiSchema({ name: 'BaseListBookmarksQuery' })
export class BaseListBookmarksQueryDto {
    @ApiPropertyOptional({
      enum: bookmarkStatusEnum.enumValues,
      default: 'active',
    })
    @IsOptional()
    @IsIn(bookmarkStatusEnum.enumValues, {
      message: `Status must be one of: ${bookmarkStatusEnum.enumValues.join(', ')}`
    })
    status: typeof bookmarkStatusEnum.enumValues[number] = 'active';

    @ApiPropertyOptional({
      description: 'Filter bookmarks by type',
      enum: bookmarkTypeEnum.enumValues,
    })
    @IsOptional()
    @IsIn(bookmarkTypeEnum.enumValues, {
      message: `Type must be one of: ${bookmarkTypeEnum.enumValues.join(', ')}`
    })
    type?: typeof bookmarkTypeEnum.enumValues[number];

    @ApiPropertyOptional({
        description: 'Field to sort bookmarks by',
        default: BookmarkSortBy.CREATED_AT,
        example: BookmarkSortBy.CREATED_AT,
        enum: BookmarkSortBy,
    })
    @IsOptional()
    @IsEnum(BookmarkSortBy)
    sort_by: BookmarkSortBy = BookmarkSortBy.CREATED_AT;

    @ApiPropertyOptional({
        description: 'Sort order',
        default: SortOrder.ASC,
        example: SortOrder.ASC,
        enum: SortOrder,
    })
    @IsOptional()
    @IsEnum(SortOrder)
    sort_order: SortOrder = SortOrder.ASC;
}

@ApiSchema({ name: 'ListAllBookmarksQuery' })
export class ListAllBookmarksQueryDto extends BaseListBookmarksQueryDto {}

@ApiSchema({ name: 'ListPaginatedBookmarksQuery' })
export class ListPaginatedBookmarksQueryDto extends IntersectionType(
  BaseListBookmarksQueryDto,
  PaginationQueryDto
) {}

@ApiSchema({ name: 'ListInfiniteBookmarksQuery' })
export class ListInfiniteBookmarksQueryDto extends IntersectionType(
  BaseListBookmarksQueryDto,
  CursorPaginationQueryDto
) {}

@ApiExtraModels(BookmarkWithMovieDto, BookmarkWithTvSeriesDto)
@ApiSchema({ name: 'ListPaginatedBookmarks' })
export class ListPaginatedBookmarksDto extends PaginatedResponseDto<BookmarkWithMediaUnion> {
  @ApiProperty({
    type: 'array',
    items: {
      oneOf: [
        { $ref: getSchemaPath(BookmarkWithMovieDto) },
        { $ref: getSchemaPath(BookmarkWithTvSeriesDto) },
      ],
      discriminator: {
        propertyName: 'type',
        mapping: {
          movie: getSchemaPath(BookmarkWithMovieDto),
          tv_series: getSchemaPath(BookmarkWithTvSeriesDto),
        },
      },
    },
  })
  @Type(() => BookmarkDto, {
    keepDiscriminatorProperty: true,
    discriminator: {
      property: 'type',
      subTypes: [
        { value: BookmarkWithMovieDto, name: 'movie' },
        { value: BookmarkWithTvSeriesDto, name: 'tv_series' },
      ],
    },
  })
  data!: BookmarkWithMediaUnion[];

  constructor(partial: Partial<ListPaginatedBookmarksDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}

@ApiExtraModels(BookmarkWithMovieDto, BookmarkWithTvSeriesDto)
@ApiSchema({ name: 'ListInfiniteBookmarks'})
export class ListInfiniteBookmarksDto extends CursorPaginatedResponseDto<BookmarkWithMediaUnion> {
  @ApiProperty({
    type: 'array',
    items: {
      oneOf: [
        { $ref: getSchemaPath(BookmarkWithMovieDto) },
        { $ref: getSchemaPath(BookmarkWithTvSeriesDto) },
      ],
      discriminator: {
        propertyName: 'type',
        mapping: {
          movie: getSchemaPath(BookmarkWithMovieDto),
          tv_series: getSchemaPath(BookmarkWithTvSeriesDto),
        },
      },
    },
  })
  @Type(() => BookmarkDto, {
    keepDiscriminatorProperty: true,
    discriminator: {
      property: 'type',
      subTypes: [
        { value: BookmarkWithMovieDto, name: 'movie' },
        { value: BookmarkWithTvSeriesDto, name: 'tv_series' },
      ],
    },
  })
  data!: BookmarkWithMediaUnion[];

  constructor(partial: Partial<ListInfiniteBookmarksDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}