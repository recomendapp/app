import { ApiSchema, ApiProperty, OmitType, ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsEnum, IsInt, IsNumber, IsOptional, Max, Min, ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { ReviewTvSeriesDto } from '../../reviews/tv-series/dto/review-tv-series.dto';
import { TvSeriesCompactDto } from '../dto/tv-series.dto';
import { SortOrder } from '../../../common/dto/sort.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { CursorPaginationQueryDto } from '../../../common/dto/cursor-pagination.dto';

export enum LogTvStatus {
  WATCHING = 'watching',
  COMPLETED = 'completed',
  DROPPED = 'dropped',
}

@ApiSchema({ name: 'LogTvSeriesRequest' })
export class LogTvSeriesRequestDto {
  @ApiProperty({ required: false, nullable: true, minimum: 0.5, maximum: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.5)
  @Max(10)
  rating?: number | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isLiked?: boolean;

  @ApiProperty({
    required: false,
    description: 'The status of the series',
    enum: LogTvStatus,
    example: LogTvStatus.WATCHING,
  })
  @IsOptional()
  @IsEnum(LogTvStatus, {
    message: `Status must be one of: ${Object.values(LogTvStatus).join(', ')}`
  })
  status?: LogTvStatus;
}

@ApiSchema({ name: 'LogTvSeries' })
export class LogTvSeriesDto {
  @ApiProperty()
  @Expose()
  @IsInt()
  id!: number;

  @ApiProperty()
  @Expose()
  @IsInt()
  tvSeriesId!: number;

  @ApiProperty()
  @Expose()
  userId!: string;

  @ApiProperty({
    enum: LogTvStatus,
    example: LogTvStatus.WATCHING
  })
  @Expose()
  @IsEnum(LogTvStatus, {
	  message: `Status must be one of: ${Object.values(LogTvStatus).join(', ')}`
  })
  status!: LogTvStatus;
  
  @ApiProperty()
  @Expose()
  @IsInt()
  episodesWatchedCount!: number;

  @ApiProperty()
  @Expose()
  @IsInt()
  watchCount!: number;
  
  @ApiProperty()
  @Expose()
  @IsBoolean()
  isLiked!: boolean;

  @ApiProperty({ nullable: true })
  @Expose()
  @IsOptional()
  @IsDateString()
  likedAt!: string | null;

  @ApiProperty({ nullable: true })
  @Expose()
  @IsOptional()
  @IsNumber()
  rating!: number | null;

  @ApiProperty({ nullable: true })
  @Expose()
  @IsOptional()
  @IsDateString()
  ratedAt!: string | null;
  
  @ApiProperty({ nullable: true })
  @Expose()
  @IsOptional()
  @IsInt()
  lastSeasonSeen!: number | null;

  @ApiProperty({ nullable: true })
  @Expose()
  @IsOptional()
  @IsInt()
  lastEpisodeSeen!: number | null;

  @ApiProperty({ nullable: true })
  @Expose()
  @IsOptional()
  @IsDateString()
  lastWatchedAt!: string | null;

  @ApiProperty()
  @Expose()
  @IsDateString()
  createdAt!: string;

  @ApiProperty()
  @Expose()
  @IsDateString()
  updatedAt!: string;

  @ApiProperty({
    type: () => ReviewTvSeriesDto,
    nullable: true,
  })
  @Expose()
  @ValidateNested()
  @Type(() => ReviewTvSeriesDto)
  review!: ReviewTvSeriesDto | null;

  constructor(data: Partial<LogTvSeriesDto>) {
    Object.assign(this, data);
  }
}

@ApiSchema({ name: 'LogTvSeriesWithTvSeriesNoReview' })
export class LogTvSeriesWithTvSeriesNoReviewDto extends OmitType(LogTvSeriesDto, ['review']) {
  @ApiProperty({ example: false })
  @Expose()
  isReviewed!: boolean;

  @ApiProperty({ description: 'The tv series details' })
  @Type(() => TvSeriesCompactDto)
  @Expose()
  tvSeries!: TvSeriesCompactDto;
}

@ApiSchema({ name: 'LogTvSeriesWithTvSeries' })
export class LogTvSeriesWithTvSeriesDto extends LogTvSeriesDto {
  @ApiProperty({ description: 'The tv series details' })
  @Type(() => TvSeriesCompactDto)
  @Expose()
  tvSeries!: TvSeriesCompactDto;
}

export enum LogTvSeriesSortBy {
  UPDATED_AT = 'updated_at',
  RATING = 'rating',
  RANDOM = 'random',
}

@ApiSchema({ name: 'BaseListLogsTvSeriesQuery' })
class BaseListLogsTvSeriesQueryDto {
	@ApiPropertyOptional({
		description: 'Field to sort logs by',
		default: LogTvSeriesSortBy.UPDATED_AT,
		example: LogTvSeriesSortBy.UPDATED_AT,
		enum: LogTvSeriesSortBy,
	})
	@IsOptional()
	@IsEnum(LogTvSeriesSortBy)
	sort_by: LogTvSeriesSortBy = LogTvSeriesSortBy.UPDATED_AT;

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

@ApiSchema({ name: 'ListPaginatedLogsTvSeriesQuery' })
export class ListPaginatedLogsTvSeriesQueryDto extends IntersectionType(
  BaseListLogsTvSeriesQueryDto,
  PaginationQueryDto
) {}

@ApiSchema({ name: 'ListInfiniteLogsTvSeriesQuery' })
export class ListInfiniteLogsTvSeriesQueryDto extends IntersectionType(
  BaseListLogsTvSeriesQueryDto,
  CursorPaginationQueryDto
) {}