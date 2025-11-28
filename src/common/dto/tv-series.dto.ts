import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import {
  IsInt,
  IsString,
  IsOptional,
  IsUrl,
  IsNumber,
  IsArray,
  IsDateString,
} from 'class-validator';
import { PersonDto } from './person.dto';
import { GenreDto } from './genre.dto';

@Exclude()
export class TvSeriesDto {
  @ApiProperty({ description: "The TV series' unique identifier" })
  @Expose()
  @IsInt()
  id: number;

  @ApiProperty({ description: 'The name of the TV series' })
  @Expose()
  @IsOptional()
  @IsString()
  name?: string | null;

  @ApiPropertyOptional({ description: 'Poster path of the TV series' })
  @Expose()
  @IsOptional()
  @IsString()
  poster_path?: string | null;

  @ApiPropertyOptional({ description: 'Poster URL of the TV series' })
  @Expose()
  @IsOptional()
  @IsUrl()
  poster_url?: string | null;

  @ApiProperty({ description: 'Backdrop path of the TV series' })
  @Expose()
  @IsOptional()
  @IsString()
  backdrop_path?: string | null;

  @ApiPropertyOptional({ description: 'Backdrop URL of the TV series' })
  @Expose()
  @IsOptional()
  @IsUrl()
  backdrop_url?: string | null;

  @ApiProperty({
    type: () => PersonDto,
    isArray: true,
    description: 'Creators of the TV series',
  })
  @Expose()
  @IsOptional()
  @IsArray()
  @Type(() => PersonDto)
  created_by?: PersonDto[];

  @ApiProperty({
    type: () => GenreDto,
    isArray: true,
    description: 'Genres of the TV series',
  })
  @Expose()
  @IsOptional()
  @IsArray()
  @Type(() => GenreDto)
  genres?: GenreDto[];

  @ApiProperty({ description: 'First air date of the TV series' })
  @Expose()
  @IsOptional()
  @IsDateString()
  first_air_date?: string | null;

  @ApiProperty({ description: 'Last air date of the TV series' })
  @Expose()
  @IsOptional()
  @IsDateString()
  last_air_date?: string | null;

  @ApiProperty({ description: 'Overview of the TV series' })
  @Expose()
  @IsOptional()
  @IsString()
  overview?: string | null;

  @ApiProperty({ description: 'Number of seasons in the TV series' })
  @Expose()
  @IsInt()
  number_of_seasons: number;

  @ApiProperty({ description: 'Number of episodes in the TV series' })
  @Expose()
  @IsInt()
  number_of_episodes: number;

  @ApiProperty({ description: 'Is it in production?' })
  @Expose()
  in_production: boolean;

  @ApiProperty({ description: 'Original language of the TV series' })
  @Expose()
  @IsString()
  original_language: string;

  @ApiProperty({ description: 'Original name of the TV series' })
  @Expose()
  @IsString()
  original_name: string;

  @ApiProperty({ description: 'Status of the TV series' })
  @Expose()
  @IsString()
  status: string;

  @ApiProperty({ description: 'Type of the TV series' })
  @Expose()
  @IsString()
  type: string;

  @ApiProperty({ description: 'Popularity score of the TV series' })
  @Expose()
  @IsNumber()
  popularity: number;

  @ApiProperty({ description: 'Vote average of the TV series' })
  @Expose()
  @IsNumber()
  vote_average: number;

  @ApiProperty({ description: 'Vote count of the TV series' })
  @Expose()
  @IsInt()
  vote_count: number;

  @ApiPropertyOptional({ description: 'Slug of the TV series' })
  @Expose()
  @IsOptional()
  @IsString()
  slug?: string | null;

  @ApiPropertyOptional({ description: 'URL to the TV series page' })
  @Expose()
  @IsOptional()
  @IsUrl()
  url?: string | null;

  @ApiPropertyOptional({
    description: 'Followers average rating of the TV series',
  })
  @Expose()
  @IsOptional()
  @IsNumber()
  follower_avg_rating?: number | null;
}
