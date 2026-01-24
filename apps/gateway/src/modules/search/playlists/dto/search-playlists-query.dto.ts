import { IsIn, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseSearchQueryDto } from 'apps/gateway/src/modules/search/common/dto/search-query.dto';

export const SORT_FIELDS = ['created_at', 'updated_at', 'title'] as const;
export type SortField = (typeof SORT_FIELDS)[number];

export class SearchPlaylistsQueryDto extends BaseSearchQueryDto {
  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'created_at',
    default: 'created_at',
    enum: SORT_FIELDS,
  })
  @IsOptional()
  @IsString()
  @IsIn(SORT_FIELDS)
  sort_by?: SortField = 'created_at';
}
