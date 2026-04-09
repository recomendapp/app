import { IsString } from 'class-validator';
import { ApiProperty, ApiSchema, IntersectionType } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { CursorPaginationQueryDto } from '../../../common/dto/cursor-pagination.dto';

export class BaseSearchPersonsQueryDto {
  @ApiProperty({
    description: 'Search query string',
    example: 'my search',
    type: String,
    nullable: false,
  })
  @IsString()
  q!: string;
}

@ApiSchema({ name: 'ListPaginatedSearchPersonsQuery' })
export class ListPaginatedSearchPersonsQueryDto extends IntersectionType(
  BaseSearchPersonsQueryDto,
  PaginationQueryDto
) {}

@ApiSchema({ name: 'ListInfiniteSearchPersonsQuery' })
export class ListInfiniteSearchPersonsQueryDto extends IntersectionType(
  BaseSearchPersonsQueryDto,
  CursorPaginationQueryDto
) {}
