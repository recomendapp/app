import {
  IsIn,
  IsOptional,
  IsString,
  IsInt,
  IsDateString,
  IsNumber,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseSearchQueryDto } from 'apps/gateway/src/modules/search/common/dto/search-query.dto';
import { Transform } from 'class-transformer';

export const SORT_FIELDS = [
  'popularity',
  'first_air_date',
  'vote_average',
] as const;
export type SortField = (typeof SORT_FIELDS)[number];

export class SearchTvSeriesQueryDto extends BaseSearchQueryDto {
  @ApiPropertyOptional({
    description: 'Sort field for TV series',
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

  @ApiPropertyOptional({ description: 'Minimum vote average (0-10)' })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }: { value: string }) => parseFloat(value))
  vote_average_min?: number;

  @ApiPropertyOptional({ description: 'Maximum vote average (0-10)' })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }: { value: string }) => parseFloat(value))
  vote_average_max?: number;

  @ApiPropertyOptional({ description: 'Minimum first air date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  first_air_date_min?: string;

  @ApiPropertyOptional({ description: 'Maximum first air date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  first_air_date_max?: string;
}
