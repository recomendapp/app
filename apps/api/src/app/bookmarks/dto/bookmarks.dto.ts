import { ApiSchema, ApiProperty, PartialType, PickType, getSchemaPath, ApiPropertyOptional, ApiExtraModels, IntersectionType } from '@nestjs/swagger';
import { IsDate, IsEnum, IsIn, IsInt, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
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

@ApiSchema({ name: 'Bookmark' })
export class BookmarkDto {
  @ApiProperty({ example: 42 })
  @Expose()
  @IsInt()
  id: number;

  @ApiProperty({ example: 'user-uuid-123' })
  @Expose()
  userId: string;

  @ApiProperty({ example: 'Must watch this weekend', nullable: true })
  @Expose()
  @IsOptional()
  @IsString()
  @MaxLength(180)
  comment: string | null;

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
  status: typeof bookmarkStatusEnum.enumValues[number];

  @ApiProperty({ example: 123456 })
  @Expose()
  @IsInt()
  mediaId: number;

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
  type: typeof bookmarkTypeEnum.enumValues[number];

  @ApiProperty({ example: '2024-01-30T12:00:00Z' })
  @Expose()
  @IsDate()
  createdAt: Date;

  @ApiProperty({ example: '2024-01-30T12:00:00Z' })
  @Expose()
  @IsDate()
  updatedAt: Date;

  constructor(data: BookmarkDto) {
    Object.assign(this, data);
  }
}

@ApiSchema({ name: 'BookmarkDtoRequest' })
export class BookmarkRequestDto extends PartialType(PickType(BookmarkDto, ['comment'] as const)) {}

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
        default: BookmarkSortBy.UPDATED_AT,
        example: BookmarkSortBy.UPDATED_AT,
        enum: BookmarkSortBy,
    })
    @IsOptional()
    @IsEnum(BookmarkSortBy)
    sort_by: BookmarkSortBy = BookmarkSortBy.UPDATED_AT;

    @ApiPropertyOptional({
        description: 'Sort order',
        default: SortOrder.DESC,
        example: SortOrder.DESC,
        enum: SortOrder,
    })
    @IsOptional()
    @IsEnum(SortOrder)
    sort_order: SortOrder = SortOrder.DESC;
}

@ApiSchema({ name: 'ListBookmarksQuery' })
export class ListBookmarksQueryDto extends IntersectionType(
  BaseListBookmarksQueryDto,
  PaginationQueryDto
) {}

@ApiSchema({ name: 'ListInfiniteBookmarksQuery' })
export class ListInfiniteBookmarksQueryDto extends IntersectionType(
  BaseListBookmarksQueryDto,
  CursorPaginationQueryDto
) {}

@ApiExtraModels(MovieCompactDto, TvSeriesCompactDto)
@ApiSchema({ name: 'BookmarkWithMedia' })
export class BookmarkWithMediaDto extends BookmarkDto {
    @ApiProperty({
        description: 'The media object associated with the bookmark',
        oneOf: [
            { $ref: getSchemaPath(MovieCompactDto) },
            { $ref: getSchemaPath(TvSeriesCompactDto) },
        ]
  })
  @Expose()
  @ValidateNested()
  @Type((options) => {
    if (options?.object?.type === 'movie') {
      return MovieCompactDto;
    } else if (options?.object?.type === 'tv_series') {
      return TvSeriesCompactDto;
    }
    return Object;
  })
  media: MovieCompactDto | TvSeriesCompactDto;
}

@ApiSchema({ name: 'ListBookmarks' })
export class ListBookmarksDto extends PaginatedResponseDto<BookmarkWithMediaDto> {
  @ApiProperty({ type: () => [BookmarkWithMediaDto] })
  @Type(() => BookmarkWithMediaDto)
  data: BookmarkWithMediaDto[];

  constructor(partial: Partial<ListBookmarksDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}

@ApiSchema({ name: 'ListInfiniteBookmarks'})
export class ListInfiniteBookmarksDto extends CursorPaginatedResponseDto<BookmarkWithMediaDto> {
  @ApiProperty({ type: () => [BookmarkWithMediaDto] })
  @Type(() => BookmarkWithMediaDto)
  data: BookmarkWithMediaDto[];

  constructor(partial: Partial<ListInfiniteBookmarksDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}