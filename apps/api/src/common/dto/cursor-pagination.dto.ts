import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

@ApiSchema({ name: 'CursorPaginationQuery' })
export class CursorPaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Cursor for the next page (usually the ID of the last item)',
    example: 'f022c2ec-f97c-4c20-888c-afd801b4b1d4',
  })
  @IsOptional()
  @IsString()
  cursor?: string;

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

@ApiSchema({ name: 'CursorPaginationMeta' })
export class CursorPaginationMetaDto {
  @ApiProperty()
  @Expose()
  per_page: number;

  @ApiPropertyOptional({ 
    description: 'The cursor to send for the next fetch. Null if end of list.',
    nullable: true 
  })
  @Expose()
  next_cursor: string | null;
}

@ApiSchema({ name: 'CursorPaginatedResponse' })
export class CursorPaginatedResponseDto<T> {
  @ApiProperty({ isArray: true })
  @Expose()
  data: T[];

  @ApiProperty({ type: CursorPaginationMetaDto })
  @Expose()
  @Type(() => CursorPaginationMetaDto)
  meta: CursorPaginationMetaDto;

  constructor(partial: Partial<CursorPaginatedResponseDto<T>>) {
    Object.assign(this, partial);
  }
}