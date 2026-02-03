import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import {
  IsInt,
  IsString,
  IsUrl,
  IsNumber,
  IsArray,
  IsDateString,
} from 'class-validator';
import { Person } from './person.dto';
import { Genre } from './genre.dto';

@Exclude()
export class TvSeries {
  @ApiProperty({
    description: "The TV series' unique identifier",
    example: 89905,
    type: Number,
    nullable: false,
  })
  @Expose()
  @IsInt()
  id: number;

  @ApiProperty({
    description: 'The name of the TV series',
    example: 'Normal People',
    type: String,
    nullable: true,
  })
  @Expose()
  @IsString()
  name?: string | null;

  @ApiProperty({
    description: 'Poster path of the TV series',
    example: '/tbKSsFd4ImzUgbYolttkq4pmOPQ.jpg',
    type: String,
    nullable: true,
  })
  @Expose()
  @IsString()
  poster_path?: string | null;

  @ApiProperty({
    description: 'Poster URL of the TV series',
    example:
      'https://image.tmdb.org/t/p/original/tbKSsFd4ImzUgbYolttkq4pmOPQ.jpg',
    type: String,
    nullable: true,
  })
  @Expose()
  @IsUrl()
  poster_url?: string | null;

  @ApiProperty({
    description: 'Backdrop path of the TV series',
    example: '/b8Sg5AWwbMI0pdU1TQvKz0y4IBd.jpg',
    type: String,
    nullable: true,
  })
  @Expose()
  @IsString()
  backdrop_path?: string | null;

  @ApiProperty({
    description: 'Backdrop URL of the TV series',
    example:
      'https://image.tmdb.org/t/p/original/b8Sg5AWwbMI0pdU1TQvKz0y4IBd.jpg',
    type: String,
    nullable: true,
  })
  @Expose()
  @IsUrl()
  backdrop_url?: string | null;

  @ApiProperty({
    type: () => Person,
    isArray: true,
    description: 'Creators of the TV series',
    example: null,
  })
  @Expose()
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
  @IsArray()
  @Type(() => Genre)
  genres?: Genre[];

  @ApiProperty({
    description: 'First air date of the TV series',
    example: '2020-04-26',
    type: String,
    nullable: true,
  })
  @Expose()
  @IsDateString()
  first_air_date?: string | null;

  @ApiProperty({
    description: 'Last air date of the TV series',
    example: '2020-04-26',
    type: String,
    nullable: true,
  })
  @Expose()
  @IsDateString()
  last_air_date?: string | null;

  @ApiProperty({
    description: 'Overview of the TV series',
    example:
      "Marianne and Connell weave in and out of each other's lives in this exploration of sex, power and the desire to love and be loved.",
    type: String,
    nullable: true,
  })
  @Expose()
  @IsString()
  overview?: string | null;

  @ApiProperty({
    description: 'Number of seasons in the TV series',
    example: 1,
    type: Number,
    nullable: true,
  })
  @Expose()
  @IsInt()
  number_of_seasons?: number | null;

  @ApiProperty({
    description: 'Number of episodes in the TV series',
    example: 12,
    type: Number,
    nullable: true,
  })
  @Expose()
  @IsInt()
  number_of_episodes?: number | null;

  @ApiProperty({
    description: 'Is it in production?',
    example: false,
    type: Boolean,
    nullable: false,
  })
  @Expose()
  in_production: boolean;

  @ApiProperty({
    description: 'Original language of the TV series',
    example: 'en',
    type: String,
    nullable: true,
  })
  @Expose()
  @IsString()
  original_language?: string | null;

  @ApiProperty({
    description: 'Original name of the TV series',
    example: 'Normal People',
    type: String,
    nullable: true,
  })
  @Expose()
  @IsString()
  original_name?: string | null;

  @ApiProperty({
    description: 'Status of the TV series',
    example: 'Ended',
    type: String,
    nullable: true,
  })
  @Expose()
  @IsString()
  status?: string | null;

  @ApiProperty({
    description: 'Type of the TV series',
    example: 'Miniseries',
    type: String,
    nullable: true,
  })
  @Expose()
  @IsString()
  type?: string | null;

  @ApiProperty({
    description: 'Popularity score of the TV series',
    example: 5.063,
    type: Number,
    nullable: false,
  })
  @Expose()
  @IsNumber()
  popularity: number;

  @ApiProperty({
    description: 'Vote average of the TV series',
    example: 8.121,
    type: Number,
    nullable: false,
  })
  @Expose()
  @IsNumber()
  vote_average: number;

  @ApiProperty({
    description: 'Vote count of the TV series',
    example: 1255,
    type: Number,
    nullable: false,
  })
  @Expose()
  @IsInt()
  vote_count: number;

  @ApiProperty({
    description: 'Slug of the TV series',
    example: '89905-normal-people',
    type: String,
    nullable: true,
  })
  @Expose()
  @IsString()
  slug?: string | null;

  @ApiProperty({
    description: 'URL to the TV series page',
    example: '/tv-series/89905-normal-people',
    type: String,
    nullable: true,
  })
  @Expose()
  @IsUrl()
  url?: string | null;

  @ApiProperty({
    description: 'Followers average rating of the TV series',
    example: 9.2,
    type: Number,
    nullable: true,
  })
  @Expose()
  @IsNumber()
  follower_avg_rating?: number | null;
}
