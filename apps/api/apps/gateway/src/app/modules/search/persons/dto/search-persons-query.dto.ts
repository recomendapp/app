import { IsIn, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseSearchQueryDto } from '../../common/dto/search-query.dto';

export const SORT_FIELDS = ['popularity'] as const;
export type SortField = (typeof SORT_FIELDS)[number];

export class SearchPersonsQueryDto extends BaseSearchQueryDto {
  @ApiPropertyOptional({
    description: 'Sort field for persons',
    example: 'popularity',
    default: 'popularity',
    enum: SORT_FIELDS,
  })
  @IsOptional()
  @IsString()
  @IsIn(SORT_FIELDS)
  sort_by?: SortField = 'popularity';
}
