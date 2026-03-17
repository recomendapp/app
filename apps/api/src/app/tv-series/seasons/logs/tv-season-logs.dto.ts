import { ApiSchema, ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { LogTvSeriesDto } from '../../logs/tv-series-logs.dto';
import { logTvStatusEnum } from '@libs/db/schemas';

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
	description: 'The status of the series',
	enum: logTvStatusEnum.enumValues,
	example: logTvStatusEnum.enumValues[0],
  })
  @IsOptional()
  @IsString()
  @IsIn(logTvStatusEnum.enumValues, {
	message: `Status must be one of: ${logTvStatusEnum.enumValues.join(', ')}`
  })
  status?: typeof logTvStatusEnum.enumValues[number];
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
	enum: logTvStatusEnum.enumValues,
	example: logTvStatusEnum.enumValues[0],
  })
  @IsString()
  @IsIn(logTvStatusEnum.enumValues, {
	message: `Status must be one of: ${logTvStatusEnum.enumValues.join(', ')}`
  })
  status: typeof logTvStatusEnum.enumValues[number];

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
  @ApiProperty({ type: () => LogTvSeasonDto, nullable: true })
  @Type(() => LogTvSeasonDto)
  season: LogTvSeasonDto | null;

  @ApiProperty({ type: () => LogTvSeriesDto })
  @Type(() => LogTvSeriesDto)
  series: LogTvSeriesDto;
}