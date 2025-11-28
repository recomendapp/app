import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from 'src/common/dto/pagination.dto';
import { TvSeriesDto } from 'src/common/dto/tv-series.dto';
import { Type } from 'class-transformer';

export class SearchTvSeriesResponseDto extends PaginatedResponseDto<TvSeriesDto> {
  @ApiProperty({ type: [TvSeriesDto] })
  @Type(() => TvSeriesDto)
  declare data: TvSeriesDto[];

  constructor(partial: Partial<SearchTvSeriesResponseDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}
