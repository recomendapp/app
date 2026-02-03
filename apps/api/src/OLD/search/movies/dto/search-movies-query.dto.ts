import {
  IsIn,
  IsOptional,
  IsString,
  IsInt,
  IsDateString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { BaseSearchQueryDto } from '../../common/dto/search-query.dto';

export const SORT_FIELDS = [
  'popularity',
  'release_date',
  'vote_average',
] as const;
export type SortField = (typeof SORT_FIELDS)[number];

export class SearchMoviesQueryDto extends BaseSearchQueryDto {
  @ApiPropertyOptional({
    description: 'Sort field for movies',
    example: 'popularity',
    default: 'popularity',
    enum: SORT_FIELDS,
  })
  @IsOptional()
  @IsString()
  @IsIn(SORT_FIELDS)
  sort_by?: SortField = 'popularity';

  @ApiPropertyOptional({
    description: 'Comma-separated list of genre IDs to filter by',
  })
  @IsOptional()
  @IsString()
  genre_ids?: string;

  @ApiPropertyOptional({ description: 'Minimum runtime in minutes' })
  @IsOptional()
  @IsInt()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  runtime_min?: number;

  @ApiPropertyOptional({ description: 'Maximum runtime in minutes' })
  @IsOptional()
  @IsInt()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  runtime_max?: number;

  @ApiPropertyOptional({ description: 'Minimum release date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  release_date_min?: string;

  @ApiPropertyOptional({ description: 'Maximum release date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  release_date_max?: string;
}
