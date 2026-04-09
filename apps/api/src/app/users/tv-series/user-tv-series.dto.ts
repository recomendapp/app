import { ApiSchema, ApiProperty } from '@nestjs/swagger';
import { ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { UserSummaryDto } from '../dto/users.dto';
import { PaginatedResponseDto } from '../../../common/dto/pagination.dto';
import { CursorPaginatedResponseDto } from '../../../common/dto/cursor-pagination.dto';
import { TvSeriesCompactDto } from '../../tv-series/dto/tv-series.dto';
import { LogTvSeriesDto, LogTvSeriesWithTvSeriesNoReviewDto } from '../../tv-series/logs/tv-series-logs.dto';

@ApiSchema({ name: 'UserTvSeriesWithUserTvSeries' })
export class UserTvSeriesWithUserTvSeriesDto extends LogTvSeriesDto {
  @ApiProperty({ type: () => UserSummaryDto, description: 'The user object' })
  @Expose()
  @ValidateNested()
  @Type(() => UserSummaryDto)
  user!: UserSummaryDto;

  @ApiProperty({ type: () => TvSeriesCompactDto, description: 'The tv series object' })
  @Expose()
  @ValidateNested()
  @Type(() => TvSeriesCompactDto)
  tvSeries!: TvSeriesCompactDto;
}


@ApiSchema({ name: 'ListPaginatedUserTvSeriesWithTvSeries'})
export class ListPaginatedUserTvSeriesWithTvSeriesDto extends PaginatedResponseDto<LogTvSeriesWithTvSeriesNoReviewDto> {
  @ApiProperty({ type: () => [LogTvSeriesWithTvSeriesNoReviewDto] })
  @Type(() => LogTvSeriesWithTvSeriesNoReviewDto)
  data!: LogTvSeriesWithTvSeriesNoReviewDto[];

  constructor(partial: Partial<ListPaginatedUserTvSeriesWithTvSeriesDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}

@ApiSchema({ name: 'ListInfiniteUserTvSeriesWithTvSeries'})
export class ListInfiniteUserTvSeriesWithTvSeriesDto extends CursorPaginatedResponseDto<LogTvSeriesWithTvSeriesNoReviewDto> {
  @ApiProperty({ type: () => [LogTvSeriesWithTvSeriesNoReviewDto] })
  @Type(() => LogTvSeriesWithTvSeriesNoReviewDto)
  data!: LogTvSeriesWithTvSeriesNoReviewDto[];

  constructor(partial: Partial<ListInfiniteUserTvSeriesWithTvSeriesDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}