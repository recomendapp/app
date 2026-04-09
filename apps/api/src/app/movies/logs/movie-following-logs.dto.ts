import { ApiSchema, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { LogMovieDto } from './log-movie.dto';
import { UserSummaryDto } from '../../users/dto/users.dto';

@ApiSchema({ name: 'MovieFollowingLogsQuery' })
export class MovieFollowingLogsQueryDto {
  @ApiPropertyOptional({
    description: 'Filter logs to only include those with a rating (useful for charts)',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  has_rating?: boolean;
}

@ApiSchema({ name: 'MovieFollowingLog' })
export class MovieFollowingLogDto extends LogMovieDto {
  @ApiProperty({ type: () => UserSummaryDto })
  @Type(() => UserSummaryDto)
  user!: UserSummaryDto;
}

@ApiSchema({ name: 'MovieFollowingAverageRating' })
export class MovieFollowingAverageRatingDto {
  @ApiProperty({
    description: 'The average rating given by the users the authenticated user follows',
    example: 7.5,
    type: Number,
    nullable: true,
  })
  averageRating!: number | null;
}