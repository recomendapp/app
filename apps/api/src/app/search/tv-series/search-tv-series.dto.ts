import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, ApiSchema, IntersectionType } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { CursorPaginationQueryDto } from '../../../common/dto/cursor-pagination.dto';
import { Transform } from 'class-transformer';

export class BaseSearchTvSeriesQueryDto {
  @ApiProperty({
    description: 'Search query string',
    example: 'my search',
    type: String,
    nullable: false,
  })
  @IsString()
  q: string;

  @ApiPropertyOptional({
    description: 'Comma-separated list of genre IDs to filter by',
    example: '28,12',
  })
  @IsOptional()
  @IsString()
  genre_ids?: string;

  @ApiPropertyOptional({ description: 'Minimum number of seasons' })
  @IsOptional()
  @IsInt()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  number_of_seasons_min?: number;

  @ApiPropertyOptional({ description: 'Maximum number of seasons' })
  @IsOptional()
  @IsInt()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  number_of_seasons_max?: number;

  @ApiPropertyOptional({ description: 'Minimum number of episodes' })
  @IsOptional()
  @IsInt()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  number_of_episodes_min?: number;

  @ApiPropertyOptional({ description: 'Maximum number of episodes' })
  @IsOptional()
  @IsInt()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  number_of_episodes_max?: number;

  @ApiPropertyOptional({ description: 'Minimum first air date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  first_air_date_min?: string;

  @ApiPropertyOptional({ description: 'Maximum first air date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  first_air_date_max?: string;
}

@ApiSchema({ name: 'ListPaginatedSearchTvSeriesQuery' })
export class ListPaginatedSearchTvSeriesQueryDto extends IntersectionType(
  BaseSearchTvSeriesQueryDto,
  PaginationQueryDto
) {}

@ApiSchema({ name: 'ListInfiniteSearchTvSeriesQuery' })
export class ListInfiniteSearchTvSeriesQueryDto extends IntersectionType(
  BaseSearchTvSeriesQueryDto,
  CursorPaginationQueryDto
) {}
