import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationQueryDto } from 'apps/gateway/src/common/dto/pagination.dto';

export class BaseSearchQueryDto extends PaginationQueryDto {
  @ApiProperty({
    description: 'Search query string',
    example: 'my search',
    type: String,
    nullable: false,
  })
  @IsString()
  q: string;
}
