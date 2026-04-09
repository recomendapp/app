import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, ApiSchema, IntersectionType } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { CursorPaginationQueryDto } from '../../../common/dto/cursor-pagination.dto';
import { Transform } from 'class-transformer';

export class BaseSearchMoviesQueryDto {
  @ApiProperty({
    description: 'Search query string',
    example: 'my search',
    type: String,
    nullable: false,
  })
  @IsString()
  q!: string;

  @ApiPropertyOptional({
    description: 'Comma-separated list of genre IDs to filter by',
    example: '28,12',
  })
  @IsOptional()
  @IsString()
  genre_ids?: string;

  @ApiPropertyOptional({ description: 'Minimum runtime in minutes', example: 90 })
  @IsOptional()
  @IsInt()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  runtime_min?: number;

  @ApiPropertyOptional({ description: 'Maximum runtime in minutes', example: 180 })
  @IsOptional()
  @IsInt()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  runtime_max?: number;

  @ApiPropertyOptional({ description: 'Minimum release date (YYYY-MM-DD)', example: '2010-01-01' })
  @IsOptional()
  @IsDateString()
  release_date_min?: string;

  @ApiPropertyOptional({ description: 'Maximum release date (YYYY-MM-DD)', example: '2020-12-31' })
  @IsOptional()
  @IsDateString()
  release_date_max?: string;
}

@ApiSchema({ name: 'ListPaginatedSearchMoviesQuery' })
export class ListPaginatedSearchMoviesQueryDto extends IntersectionType(
  BaseSearchMoviesQueryDto,
  PaginationQueryDto
) {}

@ApiSchema({ name: 'ListInfiniteSearchMoviesQuery' })
export class ListInfiniteSearchMoviesQueryDto extends IntersectionType(
  BaseSearchMoviesQueryDto,
  CursorPaginationQueryDto
) {}
