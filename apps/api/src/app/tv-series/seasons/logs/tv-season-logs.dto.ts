import { ApiSchema, ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { LogTvSeriesDto, LogTvStatus } from '../../logs/tv-series-logs.dto';

@ApiSchema({ name: 'LogTvSeasonRequest' })
export class LogTvSeasonRequestDto {
  @ApiProperty({ required: false, nullable: true, minimum: 0.5, maximum: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.5)
  @Max(10)
  rating?: number | null;
  
  @ApiProperty({
    required: false,
    description: 'The status of the series',
    enum: LogTvStatus,
    example: LogTvStatus.WATCHING,
  })
  @IsOptional()
  @IsEnum(LogTvStatus, {
    message: `Status must be one of: ${Object.values(LogTvStatus).join(', ')}`
  })
  status?: LogTvStatus;
}

@ApiSchema({ name: 'LogTvSeason' })
export class LogTvSeasonDto {
  @ApiProperty()
  @Expose()
  @IsInt()
  id: number;

  @ApiProperty()
  @Expose()
  @IsInt()
  logTvSeriesId: number;

  @ApiProperty()
  @Expose()
  @IsInt()
  tvSeasonId: number;

  @ApiProperty()
  @Expose()
  @IsInt()
  seasonNumber: number;
  
  @ApiProperty({
    description: 'The status of the series',
    enum: LogTvStatus,
    example: LogTvStatus.WATCHING,
  })
  @Expose()
  @IsEnum(LogTvStatus, {
    message: `Status must be one of: ${Object.values(LogTvStatus).join(', ')}`
  })
  status: LogTvStatus;

  @ApiProperty()
  @Expose()
  @IsInt()
  episodesWatchedCount: number;
  
  @ApiProperty({ nullable: true })
  @Expose()
  @IsOptional()
  @IsNumber()
  rating: number | null;

  @ApiProperty({ nullable: true })
  @Expose()
  @IsOptional()
  @IsDateString()
  ratedAt: string | null;

  @ApiProperty()
  @Expose()
  @IsDateString()
  createdAt: string;

  @ApiProperty()
  @Expose()
  @IsDateString()
  updatedAt: string;

  constructor(data: Partial<LogTvSeasonDto>) {
    Object.assign(this, data);
  }
}

@ApiSchema({ name: 'LogTvSeasonUpdateResponse' })
export class LogTvSeasonUpdateResponseDto {
  @ApiProperty({ type: () => LogTvSeasonDto })
  @Expose()
  @Type(() => LogTvSeasonDto)
  season: LogTvSeasonDto;

  @ApiProperty({ type: () => LogTvSeriesDto })
  @Expose()
  @Type(() => LogTvSeriesDto)
  series: LogTvSeriesDto;
}