import { watchFormatEnum } from '@libs/db/schemas';
import { ApiSchema, ApiProperty, PickType, PartialType, IntersectionType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNullable } from '../../../../../common/decorators/is-nullable.decorator';
import { WATCHED_DATE_RULES } from '../../../../../config/validation-rules';
import { Expose, Type } from 'class-transformer';
import { IsDate, IsEnum, IsIn, IsInt, IsOptional, IsString, Length, Matches, ValidateNested } from 'class-validator';
import { LogMovieDto } from '../../log-movie.dto';
import { SortOrder } from '../../../../../common/dto/sort.dto';
import { PaginatedResponseDto, PaginationQueryDto } from '../../../../../common/dto/pagination.dto';
import { CursorPaginatedResponseDto, CursorPaginationQueryDto } from '../../../../../common/dto/cursor-pagination.dto';

export enum WatchedDateSortBy {
  WATCHED_DATE = 'watched_date',
}

@ApiSchema({ name: 'WatchedDate' })
export class WatchedDateDto {
  @ApiProperty({ example: 123, description: 'The unique ID of this history entry' })
  @Expose()
  @IsInt()
  id!: number;

  @Expose()
  @ApiProperty({ example: '2023-10-27T10:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  watchedDate!: Date;

  @ApiProperty({
    description: 'The format in which the movie was watched',
    enum: watchFormatEnum.enumValues,
    example: watchFormatEnum.enumValues[0],
  })
  @Expose()
  @IsIn(watchFormatEnum.enumValues, {
    message: `Format must be one of: ${watchFormatEnum.enumValues.join(', ')}`
  })
  format!: typeof watchFormatEnum.enumValues[number];

  @ApiProperty({
    example: 'Watched with friends at home',
    description: 'Optional comment about this watch date',
    nullable: true,
    maxLength: WATCHED_DATE_RULES.COMMENT.MAX,
    minLength: WATCHED_DATE_RULES.COMMENT.MIN,
  })
  @Expose()
  @IsString()
  @IsNullable()
  @Length(WATCHED_DATE_RULES.COMMENT.MIN, WATCHED_DATE_RULES.COMMENT.MAX)
  @Matches(WATCHED_DATE_RULES.COMMENT.REGEX, {
    message: 'Comment cannot be empty or contain excessive line breaks'
  })
  comment!: string | null;

  constructor(partial: Partial<WatchedDateDto>) {
    Object.assign(this, partial);
  }
}

@ApiSchema({ name: 'WatchedDateCreate' })
export class WatchedDateCreateDto extends IntersectionType(
  PickType(WatchedDateDto, ['watchedDate'] as const),
  PartialType(PickType(WatchedDateDto, ['format', 'comment'] as const)),
) {}

@ApiSchema({ name: 'WatchedDateUpdate' })
export class WatchedDateUpdateDto extends PartialType(PickType(WatchedDateDto, [
  'watchedDate',
  'format',
  'comment'
] as const)) {}

@ApiSchema({ name: 'WatchedDateLogSync' })
export class WatchedDateLogSyncDto extends PickType(LogMovieDto, [
  'firstWatchedAt',
  'lastWatchedAt',
  'watchCount',
  'userId',
  'movieId',
] as const) {}

@ApiSchema({ name: 'WatchedDateResponse' })
export class WatchedDateResponseDto {
  @ApiProperty({ type: () => WatchedDateDto })
  @Expose()
  @ValidateNested()
  @Type(() => WatchedDateDto)
  watchedDate!: WatchedDateDto;

  @ApiProperty({ type: () => WatchedDateLogSyncDto })
  @Expose()
  @ValidateNested()
  @Type(() => WatchedDateLogSyncDto)
  log!: WatchedDateLogSyncDto;
}

@ApiSchema({ name: 'BaseListWatchedDatesQuery' })
class BaseListWatchedDatesQueryDto {
    @ApiPropertyOptional({
        description: 'Field to sort by',
        default: WatchedDateSortBy.WATCHED_DATE,
        example: WatchedDateSortBy.WATCHED_DATE,
        enum: WatchedDateSortBy,
    })
    @IsOptional()
    @IsEnum(WatchedDateSortBy)
    sort_by: WatchedDateSortBy = WatchedDateSortBy.WATCHED_DATE;

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

@ApiSchema({ name: 'ListPaginatedWatchedDatesQuery' })
export class ListPaginatedWatchedDatesQueryDto extends IntersectionType(
  BaseListWatchedDatesQueryDto,
  PaginationQueryDto
) {}

@ApiSchema({ name: 'ListInfiniteWatchedDatesQuery' })
export class ListInfiniteWatchedDatesQueryDto extends IntersectionType(
  BaseListWatchedDatesQueryDto,
  CursorPaginationQueryDto
) {}

@ApiSchema({ name: 'ListPaginatedWatchedDates' })
export class ListPaginatedWatchedDatesDto extends PaginatedResponseDto<WatchedDateDto> {
  @ApiProperty({ type: () => [WatchedDateDto] })
  @Type(() => WatchedDateDto)
  data!: WatchedDateDto[];

  constructor(partial: Partial<ListPaginatedWatchedDatesDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}

@ApiSchema({ name: 'ListInfiniteWatchedDates'})
export class ListInfiniteWatchedDatesDto extends CursorPaginatedResponseDto<WatchedDateDto> {
  @ApiProperty({ type: () => [WatchedDateDto] })
  @Type(() => WatchedDateDto)
  data!: WatchedDateDto[];

  constructor(partial: Partial<ListInfiniteWatchedDatesDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}

