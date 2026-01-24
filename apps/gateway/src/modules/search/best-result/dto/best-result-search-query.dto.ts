import { BaseSearchQueryDto } from 'apps/gateway/src/modules/search/common/dto/search-query.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class BestResultSearchQueryDto extends BaseSearchQueryDto {
  @ApiPropertyOptional({
    description:
      'The number of results to return per type (movie, TV series, etc.).',
    example: 5,
    default: 5,
  })
  @IsOptional()
  @IsInt()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  results_per_type?: number = 5;
}
