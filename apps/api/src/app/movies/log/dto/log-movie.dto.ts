import { ApiSchema, ApiProperty, OmitType, ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { IsBoolean, IsDate, IsDateString, IsEnum, IsInt, IsNumber, IsOptional, Max, Min, ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { WatchedDateDto } from './watched-date.dto';
import { ReviewMovieDto } from '../../../reviews/movie/dto/reviews-movie.dto';
import { IsNullable } from '../../../../common/decorators/is-nullable.decorator';
import { MovieCompactDto } from '../../dto/movies.dto';
import { PaginationQueryDto } from '../../../../common/dto/pagination.dto';
import { SortOrder } from '../../../../common/dto/sort.dto';
import { CursorPaginationQueryDto } from '../../../../common/dto/cursor-pagination.dto';

@ApiSchema({ name: 'LogMovieRequest' })
export class LogMovieRequestDto {
  
  @ApiProperty({ 
    description: 'Date used ONLY if this is the first time the user logs this movie.',
    required: false,
    example: '2023-10-27T10:00:00Z'
  })
  @IsOptional()
  @IsDateString()
  watchedAt?: string;

  @ApiProperty({ 
    description: 'Rating from 0.5 to 10. If set to null, removes existing rating.',
    required: false,
    nullable: true,
    minimum: 0.5,
    maximum: 10,
    example: 8.5
  })
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
}

@ApiSchema({ name: 'LogMovie' })
export class LogMovieDto {
  @ApiProperty({ example: 42 })
  @Expose()
  @IsInt()
  id: number;

  @ApiProperty({ example: 550 })
  @Expose()
  @IsInt()
  movieId: number;

  @ApiProperty({ example: 'user-uuid-123' })
  @Expose()
  userId: string;

  @ApiProperty({ example: 8.5, nullable: true })
  @Expose()
  @IsNumber()
  rating: number | null;

  @ApiProperty({ example: true })
  @Expose()
  @IsBoolean()
  isLiked: boolean;

  @ApiProperty({ example: 1, description: 'Total number of times watched' })
  @Expose()
  @IsInt()
  watchCount: number;

  @ApiProperty({ example: '2024-01-15T14:30:00Z' })
  @Expose()
  @IsDateString()
  firstWatchedAt: Date;

  @ApiProperty({ example: '2024-01-30T12:00:00Z' })
  @Expose()
  @IsDateString()
  lastWatchedAt: Date;

  @ApiProperty({ example: '2024-01-30T12:00:00Z' })
  @Expose()
  @IsDate()
  createdAt: Date;

  @ApiProperty({ example: '2024-01-30T12:00:00Z' })
  @Expose()
  @IsDate()
  updatedAt: Date;

  @ApiProperty({ 
    type: [WatchedDateDto], 
    description: 'List of all dates this movie was watched' 
  })
  @Expose()
  @Type(() => WatchedDateDto)
  watchedDates: WatchedDateDto[];

  @ApiProperty({
    type: () => ReviewMovieDto,
    description: 'The user object',
    nullable: true,
  })
  @Expose()
  @IsNullable()
  @ValidateNested({ each: true })
  @Type(() => ReviewMovieDto)
  review: ReviewMovieDto;

  constructor(data: LogMovieDto) {
    Object.assign(this, data);
  }
}

@ApiSchema({ name: 'LogMovieWithMovie' })
export class LogMovieWithMovieDto extends OmitType(LogMovieDto, ['review', 'watchedDates']) {
  @ApiProperty({ example: false })
  @Expose()
  isReviewed: boolean;

  @ApiProperty({ description: 'The movie details' })
  @Type(() => MovieCompactDto)
  movie: MovieCompactDto;
}

export enum LogMovieSortBy {
  UPDATED_AT = 'updated_at',
  RATING = 'rating',
  FIRST_WATCHED_AT = 'first_watched_at',
  RANDOM = 'random',
}

@ApiSchema({ name: 'BaseListLogsMovieQuery' })
class BaseListLogsMovieQueryDto {
    @ApiPropertyOptional({
        description: 'Field to sort logs by',
        default: LogMovieSortBy.UPDATED_AT,
        example: LogMovieSortBy.UPDATED_AT,
        enum: LogMovieSortBy,
    })
    @IsOptional()
    @IsEnum(LogMovieSortBy)
    sort_by: LogMovieSortBy = LogMovieSortBy.UPDATED_AT;

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

@ApiSchema({ name: 'ListLogsMovieQuery' })
export class ListLogsMovieQueryDto extends IntersectionType(
  BaseListLogsMovieQueryDto,
  PaginationQueryDto
) {}

@ApiSchema({ name: 'ListInfiniteLogsMovieQuery' })
export class ListInfiniteLogsMovieQueryDto extends IntersectionType(
  BaseListLogsMovieQueryDto,
  CursorPaginationQueryDto
) {}