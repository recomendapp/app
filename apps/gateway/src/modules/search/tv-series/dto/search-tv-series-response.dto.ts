import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from 'apps/gateway/src/common/dto/pagination.dto';
import { TvSeries } from 'apps/gateway/src/common/dto/tv-series.dto';
import { Type } from 'class-transformer';

export class SearchTvSeriesResponse extends PaginatedResponseDto<TvSeries> {
  @ApiProperty({ type: [TvSeries] })
  @Type(() => TvSeries)
  declare data: TvSeries[];

  constructor(partial: Partial<SearchTvSeriesResponse>) {
    super(partial);
    Object.assign(this, partial);
  }
}
