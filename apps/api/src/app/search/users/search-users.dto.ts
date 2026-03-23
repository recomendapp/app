import { IsString } from 'class-validator';
import { ApiProperty, ApiSchema, IntersectionType } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { CursorPaginationQueryDto } from '../../../common/dto/cursor-pagination.dto';

export class BaseSearchUsersQueryDto {
  @ApiProperty({
    description: 'Search query string',
    example: 'my search',
    type: String,
    nullable: false,
  })
  @IsString()
  q: string;
}

@ApiSchema({ name: 'ListPaginatedSearchUsersQuery' })
export class ListPaginatedSearchUsersQueryDto extends IntersectionType(
  BaseSearchUsersQueryDto,
  PaginationQueryDto
) {}

@ApiSchema({ name: 'ListInfiniteSearchUsersQuery' })
export class ListInfiniteSearchUsersQueryDto extends IntersectionType(
  BaseSearchUsersQueryDto,
  CursorPaginationQueryDto
) {}
