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
import { Person } from './person.dto';
import { Genre } from './genre.dto';

// "id": 89905,
//       "name": "Normal People",
//       "poster_path": "/tbKSsFd4ImzUgbYolttkq4pmOPQ.jpg",
//       "poster_url": "https://image.tmdb.org/t/p/original/tbKSsFd4ImzUgbYolttkq4pmOPQ.jpg",
//       "backdrop_path": "/b8Sg5AWwbMI0pdU1TQvKz0y4IBd.jpg",
//       "backdrop_url": "https://image.tmdb.org/t/p/original/b8Sg5AWwbMI0pdU1TQvKz0y4IBd.jpg",
//       "created_by": null,
//       "genres": [
//         {
//           "id": 18,
//           "name": "Drama"
//         }
//       ],
//       "first_air_date": "2020-04-26",
//       "last_air_date": "2020-04-26",
//       "overview": "Marianne and Connell weave in and out of each other's lives in this exploration of sex, power and the desire to love and be loved.",
//       "number_of_seasons": 1,
//       "number_of_episodes": 12,
//       "in_production": false,
//       "original_language": "en",
//       "original_name": "Normal People",
//       "status": "Ended",
//       "type": "Miniseries",
//       "popularity": 5.063,
//       "vote_average": 8.121,
//       "vote_count": 1255,
//       "slug": "89905-normal-people",
//       "url": "/tv-series/89905-normal-people",
//       "follower_avg_rating": null

@Exclude()
export class TvSeries {
  @ApiProperty({
    description: "The TV series' unique identifier",
    example: 89905,
  })
  @Expose()
  @IsInt()
  id: number;

  @ApiProperty({
    description: 'The name of the TV series',
    example: 'Normal People',
  })
  @Expose()
  @IsOptional()
  @IsString()
  name?: string | null;

  @ApiPropertyOptional({
    description: 'Poster path of the TV series',
    example: '/tbKSsFd4ImzUgbYolttkq4pmOPQ.jpg',
  })
  @Expose()
  @IsOptional()
  @IsString()
  poster_path?: string | null;

  @ApiPropertyOptional({
    description: 'Poster URL of the TV series',
    example:
      'https://image.tmdb.org/t/p/original/tbKSsFd4ImzUgbYolttkq4pmOPQ.jpg',
  })
  @Expose()
  @IsOptional()
  @IsUrl()
  poster_url?: string | null;

  @ApiProperty({
    description: 'Backdrop path of the TV series',
    example: '/b8Sg5AWwbMI0pdU1TQvKz0y4IBd.jpg',
  })
  @Expose()
  @IsOptional()
  @IsString()
  backdrop_path?: string | null;

  @ApiPropertyOptional({
    description: 'Backdrop URL of the TV series',
    example:
      'https://image.tmdb.org/t/p/original/b8Sg5AWwbMI0pdU1TQvKz0y4IBd.jpg',
  })
  @Expose()
  @IsOptional()
  @IsUrl()
  backdrop_url?: string | null;

  @ApiProperty({
    type: () => Person,
    isArray: true,
    description: 'Creators of the TV series',
    example: null,
  })
  @Expose()
  @IsOptional()
  @IsArray()
  @Type(() => Person)
  created_by?: Person[];

  @ApiProperty({
    type: () => Genre,
    isArray: true,
    description: 'Genres of the TV series',
    example: [
      {
        id: 18,
        name: 'Drama',
      },
    ],
  })
  @Expose()
  @IsOptional()
  @IsArray()
  @Type(() => Genre)
  genres?: Genre[];

  @ApiProperty({
    description: 'First air date of the TV series',
    example: '2020-04-26',
  })
  @Expose()
  @IsOptional()
  @IsDateString()
  first_air_date?: string | null;

  @ApiProperty({
    description: 'Last air date of the TV series',
    example: '2020-04-26',
  })
  @Expose()
  @IsOptional()
  @IsDateString()
  last_air_date?: string | null;

  @ApiProperty({
    description: 'Overview of the TV series',
    example:
      "Marianne and Connell weave in and out of each other's lives in this exploration of sex, power and the desire to love and be loved.",
  })
  @Expose()
  @IsOptional()
  @IsString()
  overview?: string | null;

  @ApiProperty({
    description: 'Number of seasons in the TV series',
    example: 1,
  })
  @Expose()
  @IsOptional()
  @IsInt()
  number_of_seasons?: number | null;

  @ApiProperty({
    description: 'Number of episodes in the TV series',
    example: 12,
  })
  @Expose()
  @IsOptional()
  @IsInt()
  number_of_episodes?: number | null;

  @ApiProperty({ description: 'Is it in production?', example: false })
  @Expose()
  in_production: boolean;

  @ApiProperty({
    description: 'Original language of the TV series',
    example: 'en',
  })
  @Expose()
  @IsOptional()
  @IsString()
  original_language?: string | null;

  @ApiProperty({
    description: 'Original name of the TV series',
    example: 'Normal People',
  })
  @Expose()
  @IsOptional()
  @IsString()
  original_name?: string | null;

  @ApiProperty({ description: 'Status of the TV series', example: 'Ended' })
  @Expose()
  @IsOptional()
  @IsString()
  status?: string | null;

  @ApiProperty({ description: 'Type of the TV series', example: 'Miniseries' })
  @Expose()
  @IsOptional()
  @IsString()
  type?: string | null;

  @ApiProperty({
    description: 'Popularity score of the TV series',
    example: 5.063,
  })
  @Expose()
  @IsNumber()
  popularity: number;

  @ApiProperty({ description: 'Vote average of the TV series', example: 8.121 })
  @Expose()
  @IsNumber()
  vote_average: number;

  @ApiProperty({ description: 'Vote count of the TV series', example: 1255 })
  @Expose()
  @IsInt()
  vote_count: number;

  @ApiPropertyOptional({
    description: 'Slug of the TV series',
    example: '89905-normal-people',
  })
  @Expose()
  @IsOptional()
  @IsString()
  slug?: string | null;

  @ApiPropertyOptional({
    description: 'URL to the TV series page',
    example: '/tv-series/89905-normal-people',
  })
  @Expose()
  @IsOptional()
  @IsUrl()
  url?: string | null;

  @ApiPropertyOptional({
    description: 'Followers average rating of the TV series',
    example: 9.2,
  })
  @Expose()
  @IsOptional()
  @IsNumber()
  follower_avg_rating?: number | null;
}
