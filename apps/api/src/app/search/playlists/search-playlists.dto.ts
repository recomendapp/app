import { IsString } from 'class-validator';
import { ApiProperty, ApiSchema, IntersectionType } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { CursorPaginationQueryDto } from '../../../common/dto/cursor-pagination.dto';

export class BaseSearchPlaylistsQueryDto {
  @ApiProperty({
    description: 'Search query string',
    example: 'my search',
    type: String,
    nullable: false,
  })
  @IsString()
  q: string;
}

@ApiSchema({ name: 'ListPaginatedSearchPlaylistsQuery' })
export class ListPaginatedSearchPlaylistsQueryDto extends IntersectionType(
  BaseSearchPlaylistsQueryDto,
  PaginationQueryDto
) {}

@ApiSchema({ name: 'ListInfiniteSearchPlaylistsQuery' })
export class ListInfiniteSearchPlaylistsQueryDto extends IntersectionType(
  BaseSearchPlaylistsQueryDto,
  CursorPaginationQueryDto
) {}
