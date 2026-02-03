import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseSearchQueryDto } from '../../common/dto/search-query.dto';

export const SORT_FIELDS = [
  'username',
  'full_name',
  'followers_count',
  'created_at',
] as const;
export type SortField = (typeof SORT_FIELDS)[number];

export class SearchUsersQueryDto extends BaseSearchQueryDto {
  @ApiPropertyOptional({
    description: 'Comma-separated list of user IDs to exclude from the search',
  })
  @IsOptional()
  @IsString()
  exclude_ids?: string;
}
