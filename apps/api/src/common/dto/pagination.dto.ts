import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, Max, Min, ValidateNested } from 'class-validator';

@ApiSchema({ name: 'PaginationQuery' })
export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1,
    minimum: 1,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({
    description: 'Number of results per page',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 100,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  per_page = 10;
}

@ApiSchema({ name: 'PaginationMeta' })
export class PaginationMetaDto {
  @ApiProperty()
  @Expose()
  @IsInt()
  total_results!: number;

  @ApiProperty()
  @Expose()
  @IsInt()
  total_pages!: number;

  @ApiProperty()
  @Expose()
  @IsInt()
  current_page!: number;

  @ApiProperty()
  @Expose()
  @IsInt()
  per_page!: number;
}

@ApiSchema({ name: 'PaginatedResponse' })
export class PaginatedResponseDto<T> {
  @ApiProperty({ isArray: true })
  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  data!: T[];

  @ApiProperty({ type: PaginationMetaDto })
  @Expose()
  @Type(() => PaginationMetaDto)
  @ValidateNested()
  meta!: PaginationMetaDto;

  constructor(partial: Partial<PaginatedResponseDto<T>>) {
    Object.assign(this, partial);
  }
}
