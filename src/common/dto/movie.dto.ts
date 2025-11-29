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
import { Genre } from './genre.dto';
import { Person } from './person.dto';

@Exclude()
export class Movie {
  @ApiProperty({
    description: "The movie's unique identifier",
    example: 157336,
  })
  @Expose()
  @IsInt()
  id: number;

  @ApiProperty({
    description: 'The title of the movie',
    example: 'Interstellar',
  })
  @Expose()
  @IsOptional()
  @IsString()
  title?: string | null;

  @ApiPropertyOptional({
    description: 'Poster path of the movie',
    example: '/iawqQdFKI7yTUoSkDNP8gyV3J3r.jpg',
  })
  @Expose()
  @IsOptional()
  @IsString()
  poster_path?: string | null;

  @ApiPropertyOptional({
    description: 'Poster URL of the movie',
    example:
      'https://image.tmdb.org/t/p/original/iawqQdFKI7yTUoSkDNP8gyV3J3r.jpg',
  })
  @Expose()
  @IsOptional()
  @IsUrl()
  poster_url?: string | null;

  @ApiProperty({
    description: 'Backdrop path of the movie',
    example: '/5XNQBqnBwPA9yT0jZ0p3s8bbLh0.jpg',
  })
  @Expose()
  @IsOptional()
  @IsString()
  backdrop_path?: string | null;

  @ApiPropertyOptional({
    description: 'Backdrop URL of the movie',
    example:
      'https://image.tmdb.org/t/p/original/5XNQBqnBwPA9yT0jZ0p3s8bbLh0.jpg',
  })
  @Expose()
  @IsOptional()
  @IsUrl()
  backdrop_url?: string | null;

  @ApiProperty({
    type: () => Person,
    isArray: true,
    description: 'Directors of the movie',
  })
  @Expose()
  @IsOptional()
  @IsArray()
  @Type(() => Person)
  directors?: Person[];

  @ApiProperty({
    type: () => Genre,
    isArray: true,
    description: 'Genres of the movie',
  })
  @Expose()
  @IsOptional()
  @IsArray()
  @Type(() => Genre)
  genres?: Genre[];

  @ApiProperty({
    description: 'Release date of the movie',
    example: '2014-11-05T00:00:00+00:00',
  })
  @Expose()
  @IsOptional()
  @IsDateString()
  release_date?: string | null;

  @ApiProperty({
    description: 'Overview of the movie',
    example:
      'The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.',
  })
  @Expose()
  @IsOptional()
  @IsString()
  overview?: string | null;

  @ApiProperty({
    description: 'Budget of the movie in USD',
    example: 165000000,
  })
  @Expose()
  @IsOptional()
  @IsInt()
  budget?: number | null;

  @ApiProperty({
    description: 'Homepage URL of the movie',
    example: 'http://www.interstellarmovie.net/',
  })
  @Expose()
  @IsOptional()
  @IsUrl()
  homepage?: string | null;

  @ApiProperty({
    description: 'Revenue of the movie in USD',
    example: 746606706,
  })
  @Expose()
  @IsOptional()
  @IsInt()
  revenue?: number | null;

  @ApiProperty({ description: 'Runtime of the movie in minutes', example: 169 })
  @Expose()
  @IsOptional()
  @IsInt()
  runtime?: number | null;

  @ApiProperty({ description: 'Original language of the movie', example: 'en' })
  @Expose()
  @IsOptional()
  @IsString()
  original_language?: string | null;

  @ApiProperty({
    description: 'Original title of the movie',
    example: 'Interstellar',
  })
  @Expose()
  @IsOptional()
  @IsString()
  original_title?: string | null;

  @ApiProperty({ description: 'Status of the movie', example: 'Released' })
  @Expose()
  @IsOptional()
  @IsString()
  status?: string | null;

  @ApiProperty({
    description: 'Popularity score of the movie',
    example: 37.1433,
  })
  @Expose()
  @IsNumber()
  popularity: number;

  @ApiProperty({ description: 'Vote average of the movie', example: 8.463 })
  @Expose()
  @IsNumber()
  vote_average: number;

  @ApiProperty({ description: 'Vote count of the movie', example: 38288 })
  @Expose()
  @IsInt()
  vote_count: number;

  @ApiPropertyOptional({
    description: 'Slug of the movie',
    example: '157336-interstellar',
  })
  @Expose()
  @IsOptional()
  @IsString()
  slug?: string | null;

  @ApiPropertyOptional({
    description: 'URL to the movie page',
    example: '/film/157336-interstellar',
  })
  @Expose()
  @IsOptional()
  @IsUrl()
  url?: string | null;

  @ApiPropertyOptional({
    description: 'Followers average rating of the movie',
    example: 9.2,
  })
  @Expose()
  @IsOptional()
  @IsNumber()
  follower_avg_rating?: number | null;
}
