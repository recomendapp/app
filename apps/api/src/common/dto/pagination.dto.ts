import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

@ApiSchema({ name: 'PaginationQuery' })
export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of results per page',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  per_page?: number = 10;
}

@ApiSchema({ name: 'PaginationMeta' })
export class PaginationMetaDto {
  @ApiProperty()
  @Expose()
  total_results: number;

  @ApiProperty()
  @Expose()
  total_pages: number;

  @ApiProperty()
  @Expose()
  current_page: number;

  @ApiProperty()
  @Expose()
  per_page: number;
}

@ApiSchema({ name: 'PaginatedResponse' })
export class PaginatedResponseDto<T> {
  @ApiProperty({ isArray: true })
  @Expose()
  data: T[];

  @ApiProperty({ type: PaginationMetaDto })
  @Expose()
  @Type(() => PaginationMetaDto)
  meta: PaginationMetaDto;

  constructor(partial: Partial<PaginatedResponseDto<T>>) {
    Object.assign(this, partial);
  }
}
