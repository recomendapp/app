import { ApiSchema, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { LogTvSeriesDto } from './tv-series-logs.dto';
import { UserSummaryDto } from '../../users/dto/users.dto';

@ApiSchema({ name: 'FollowingLogsQuery' })
export class TvSeriesFollowingLogsQueryDto {
  @ApiPropertyOptional({
	description: 'Filter logs to only include those with a rating (useful for charts)',
	example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  has_rating?: boolean;
}

@ApiSchema({ name: 'TvSeriesFollowingLog' })
export class TvSeriesFollowingLogDto extends LogTvSeriesDto {
  @ApiProperty({ type: () => UserSummaryDto })
  @Type(() => UserSummaryDto)
  user: UserSummaryDto;
}

@ApiSchema({ name: 'TvSeriesFollowingAverageRating' })
export class TvSeriesFollowingAverageRatingDto {
  @ApiProperty({
	description: 'The average rating given by the users the authenticated user follows',
	example: 7.5,
	type: Number,
	nullable: true,
  })
  averageRating: number | null;
}