import { ApiSchema, ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { LogTvSeasonDto } from '../../logs/tv-season-logs.dto';
import { LogTvSeriesDto } from '../../../logs/tv-series-logs.dto';

@ApiSchema({ name: 'LogTvEpisodeRequest' })
export class LogTvEpisodeRequestDto {
  @ApiProperty({ 
    description: 'Rating from 0.5 to 10. If set to null, removes existing rating.',
    required: false,
    nullable: true,
    minimum: 0.5,
    maximum: 10,
    example: 8.5
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.5)
  @Max(10)
  rating?: number | null;
}

@ApiSchema({ name: 'LogTvEpisode' })
export class LogTvEpisodeDto {
  @ApiProperty({ example: 42 })
  @Expose()
  @IsInt()
  id: number;

  @ApiProperty({ example: 12345, description: 'The internal ID of the global series log' })
  @Expose()
  @IsInt()
  logTvSeriesId: number;

  @ApiProperty({ example: 6789, description: 'The internal ID of the season log' })
  @Expose()
  @IsInt()
  logTvSeasonId: number;

  @ApiProperty({ example: 550, description: 'The TMDB Episode ID' })
  @Expose()
  @IsInt()
  tvEpisodeId: number;

  @ApiProperty({ example: 1 })
  @Expose()
  @IsInt()
  seasonNumber: number;

  @ApiProperty({ example: 3 })
  @Expose()
  @IsInt()
  episodeNumber: number;

  @ApiProperty({ example: 8.5, nullable: true })
  @Expose()
  @IsOptional()
  @IsNumber()
  rating: number | null;

  @ApiProperty({ example: '2024-01-30T12:00:00Z', nullable: true })
  @Expose()
  @IsOptional()
  @IsDateString()
  ratedAt: string | null;

  @ApiProperty({ example: '2024-01-30T12:00:00Z', description: 'When the user watched it' })
  @Expose()
  @IsDateString()
  watchedAt: string;

  @ApiProperty({ example: '2024-01-30T12:00:00Z' })
  @Expose()
  @IsDateString()
  createdAt: string;

  @ApiProperty({ example: '2024-01-30T12:00:00Z' })
  @Expose()
  @IsDateString()
  updatedAt: string;

  constructor(data: LogTvEpisodeDto) {
    Object.assign(this, data);
  }
}

@ApiSchema({ name: 'LogTvEpisodeUpdateResponse' })
export class LogTvEpisodeUpdateResponseDto {
  @ApiProperty({ type: () => LogTvEpisodeDto })
  @Type(() => LogTvEpisodeDto)
  episode: LogTvEpisodeDto;

  @ApiProperty({ type: () => LogTvSeasonDto })
  @Type(() => LogTvSeasonDto)
  season: LogTvSeasonDto;

  @ApiProperty({ type: () => LogTvSeriesDto })
  @Type(() => LogTvSeriesDto)
  series: LogTvSeriesDto;
}