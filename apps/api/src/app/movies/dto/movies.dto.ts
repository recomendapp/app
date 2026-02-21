import { ApiProperty, ApiSchema, PickType } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsInt,
  IsString,
  IsUrl,
  IsNumber,
  IsArray,
  IsDateString,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { PersonCompactDto } from '../../persons/dto/persons.dto';
import { GenreDto } from './genres.dto';

export enum MovieSortBy {
  RELEASE_DATE = 'release_date',
  POPULARITY = 'popularity',
  VOTE_AVERAGE = 'vote_average',
}

@ApiSchema({ name: 'Movie' })
export class MovieDto {
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
    type: String,
    nullable: true,
  })
  @Expose()
  @IsString()
  title: string | null;

  @ApiProperty({
    description: 'Poster path of the movie',
    example: '/iawqQdFKI7yTUoSkDNP8gyV3J3r.jpg',
    type: String,
    nullable: true,
  })
  @Expose()
  @IsString()
  posterPath: string | null;

  @ApiProperty({
    description: 'Backdrop path of the movie',
    example: '/5XNQBqnBwPA9yT0jZ0p3s8bbLh0.jpg',
    type: String,
    nullable: true,
  })
  @Expose()
  @IsString()
  backdropPath: string | null;

  @ApiProperty({
    type: () => PersonCompactDto,
    isArray: true,
    description: 'Directors of the movie',
  })
  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PersonCompactDto)
  directors: PersonCompactDto[];

  @ApiProperty({
    type: () => GenreDto,
    isArray: true,
    description: 'Genres of the movie',
  })
  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GenreDto)
  genres: GenreDto[];

  @ApiProperty({
    type: () => MovieTrailerDto,
    isArray: true,
    description: 'Trailers of the movie',
  })
  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MovieTrailerDto)
  trailers: MovieTrailerDto[];

  @ApiProperty({
    description: 'Release date of the movie',
    example: '2014-11-05',
    type: String,
    nullable: true,
  })
  @Expose()
  @IsDateString()
  releaseDate: string | null;

  @ApiProperty({
    description: 'Overview of the movie',
    example:
      'The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.',
    type: String,
    nullable: true,
  })
  @Expose()
  @IsString()
  overview: string | null;

  @ApiProperty({
    description: 'Budget of the movie in USD',
    example: 165000000,
    type: Number,
    nullable: true,
  })
  @Expose()
  @IsInt()
  budget: number | null;

  @ApiProperty({
    description: 'Homepage URL of the movie',
    example: 'http://www.interstellarmovie.net/',
    type: String,
    nullable: true,
  })
  @Expose()
  @IsUrl()
  homepage: string | null;

  @ApiProperty({
    description: 'Revenue of the movie in USD',
    example: 746606706,
    type: Number,
    nullable: true,
  })
  @Expose()
  @IsInt()
  revenue: number | null;

  @ApiProperty({
    description: 'Runtime of the movie in minutes',
    example: 169,
    type: Number,
    nullable: true,
  })
  @Expose()
  @IsInt()
  runtime: number | null;

  @ApiProperty({
    description: 'Original language of the movie',
    example: 'en',
    type: String,
    nullable: true,
  })
  @Expose()
  @IsString()
  originalLanguage: string | null;

  @ApiProperty({
    description: 'Original title of the movie',
    example: 'Interstellar',
    type: String,
    nullable: true,
  })
  @Expose()
  @IsString()
  originalTitle: string | null;

  @ApiProperty({
    description: 'Status of the movie',
    example: 'Released',
    type: String,
    nullable: true,
  })
  @Expose()
  @IsString()
  status: string | null;

  @ApiProperty({
    description: 'Popularity score of the movie',
    example: 37.1433,
    type: Number,
    nullable: false,
  })
  @Expose()
  @IsNumber()
  popularity: number;

  @ApiProperty({
    description: 'Vote average of the movie',
    example: 8.463,
    type: Number,
    nullable: false,
  })
  @Expose()
  @IsNumber()
  voteAverage: number;

  @ApiProperty({
    description: 'Vote count of the movie',
    example: 38288,
    type: Number,
    nullable: false,
  })
  @Expose()
  @IsInt()
  voteCount: number;

  @ApiProperty({
    description: 'Slug of the movie',
    example: '157336-interstellar',
    type: String,
    nullable: true,
  })
  @Expose()
  @IsString()
  slug: string | null;

  @ApiProperty({
    description: 'URL to the movie page',
    example: '/film/157336-interstellar',
    type: String,
    nullable: true,
  })
  @Expose()
  @IsUrl()
  url: string | null;

  @ApiProperty({
    description: 'Followers average rating of the movie',
    example: 9.2,
    type: Number,
    nullable: true,
  })
  @Expose()
  @IsNumber()
  followerAvgRating: number | null;
}
@ApiSchema({ name: 'MovieTrailer' })
export class MovieTrailerDto {
  @ApiProperty({ example: '5c9294240e0a267cd516835f' })
  @Expose()
  @IsString()
  id: string;

  @ApiProperty({ example: 'Official Trailer' })
  @Expose()
  @IsString()
  name: string;

  @ApiProperty({ example: 'zSWdZVtXT7E', description: 'YouTube video key' })
  @Expose()
  @IsString()
  key: string;

  @ApiProperty({ example: 'YouTube' })
  @Expose()
  @IsString()
  site: string;

  @ApiProperty({ example: 1080, description: 'Resolution (e.g., 1080, 720)' })
  @Expose()
  @IsInt()
  size: number;

  @ApiProperty({ example: 'Trailer' })
  @Expose()
  @IsString()
  type: string;

  @ApiProperty({ example: true })
  @Expose()
  @IsBoolean()
  official: boolean;

  @ApiProperty({ example: '2014-10-01T17:55:04Z' })
  @Expose()
  @IsDateString()
  publishedAt: string;

  @ApiProperty({ example: 'en', nullable: true })
  @Expose()
  @IsString()
  iso6391: string | null;

  @ApiProperty({ example: 'US', nullable: true })
  @Expose()
  @IsString()
  iso31661: string | null;
}

@ApiSchema({ name: 'MovieCompact' })
export class MovieCompactDto extends PickType(MovieDto, [
  'id',
  'title',
  'slug',
  'url',
  'posterPath',
  'backdropPath',
  'directors',
  'releaseDate',
  'voteAverage',
  'voteCount',
  'popularity',
  'genres',
  'followerAvgRating',
] as const) {}
