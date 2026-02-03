import { ApiSchema, ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { Exclude, Expose, Type } from 'class-transformer';
import { WatchedDateDto } from './watched-date.dto';

/* -------------------------------- REQUESTS -------------------------------- */

@ApiSchema({ name: 'LogMovieRequest' })
export class LogMovieRequestDto {
  
  @ApiProperty({ 
    description: 'Date used ONLY if this is the first time the user logs this movie.',
    required: false,
    example: '2023-10-27T10:00:00Z'
  })
  @IsOptional()
  @IsDateString()
  watchedAt?: string;

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

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isLiked?: boolean;
}

/* -------------------------------- RESPONSES ------------------------------- */

@ApiSchema({ name: 'LogMovie' })
@Exclude()
export class LogMovieDto {
  @Expose()
  @ApiProperty({ example: 42 })
  id!: number;

  @Expose()
  @ApiProperty({ example: 550 })
  movieId!: number;

  @Expose()
  @ApiProperty({ example: 'user-uuid-123' })
  userId!: string;

  @Expose()
  @ApiProperty({ example: 8.5, nullable: true })
  rating!: number | null;

  @Expose()
  @ApiProperty({ example: true })
  isLiked!: boolean;

  @Expose()
  @ApiProperty({ example: 1, description: 'Total number of times watched' })
  watchCount!: number;

  @Expose()
  @ApiProperty({ example: '2024-01-15T14:30:00Z' })
  firstWatchedAt!: Date;

  @Expose()
  @ApiProperty({ example: '2024-01-30T12:00:00Z' })
  lastWatchedAt!: Date;

  @Expose()
  @ApiProperty({ example: '2024-01-30T12:00:00Z' })
  updatedAt!: Date;

  @Expose()
  @ApiProperty({ 
    type: [WatchedDateDto], 
    description: 'List of all dates this movie was watched' 
  })
  @Type(() => WatchedDateDto)
  watchedDates!: WatchedDateDto[];

  constructor(data: LogMovieDto) {
    Object.assign(this, data);
  }
}