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
import { GenreDto } from '../../movies/dto/genres.dto';

export enum TvSeriesSortBy {
  LAST_AIR_DATE = 'last_air_date',
  POPULARITY = 'popularity',
  VOTE_AVERAGE = 'vote_average',
}

@ApiSchema({ name: 'TvSeries' })
export class TvSeriesDto {
  @ApiProperty({
    description: "The TV series' unique identifier",
    example: 1399,
  })
  @Expose()
  @IsInt()
  id: number;

  @ApiProperty({
    description: 'The name of the TV series',
    example: 'Game of Thrones',
    type: String,
    nullable: true,
  })
  @Expose()
  @IsString()
  name: string | null;

  @ApiProperty({
    description: 'Poster path of the TV series',
    example: '/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg',
    type: String,
    nullable: true,
  })
  @Expose()
  @IsString()
  posterPath: string | null;

  @ApiProperty({
    description: 'Backdrop path of the TV series',
    example: '/suopoADq0k8YZr4dQXcU6pToj6s.jpg',
    type: String,
    nullable: true,
  })
  @Expose()
  @IsString()
  backdropPath: string | null;

  @ApiProperty({
    type: () => PersonCompactDto,
    isArray: true,
    description: 'Creators of the TV series',
    nullable: true,
  })
  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PersonCompactDto)
  createdBy: PersonCompactDto[] | null;

  @ApiProperty({
    type: () => GenreDto,
    isArray: true,
    description: 'Genres of the TV series',
    nullable: true,
  })
  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GenreDto)
  genres: GenreDto[] | null;

  @ApiProperty({
    type: () => TvSeriesTrailerDto,
    isArray: true,
    description: 'Trailers of the TV series',
    nullable: true,
  })
  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TvSeriesTrailerDto)
  trailers: TvSeriesTrailerDto[] | null;

  @ApiProperty({
    description: 'First air date of the TV series',
    example: '2011-04-17',
    type: String,
    nullable: true,
  })
  @Expose()
  @IsDateString()
  firstAirDate: string | null;

  @ApiProperty({
    description: 'Last air date of the TV series',
    example: '2019-05-19',
    type: String,
    nullable: true,
  })
  @Expose()
  @IsDateString()
  lastAirDate: string | null;

  @ApiProperty({
    description: 'Overview of the TV series',
    example:
      'Seven noble families fight for control of the mythical land of Westeros.',
    type: String,
    nullable: true,
  })
  @Expose()
  @IsString()
  overview: string | null;

  @ApiProperty({
    description: 'Total number of episodes',
    example: 73,
    type: Number,
    nullable: true,
  })
  @Expose()
  @IsInt()
  numberOfEpisodes: number | null;

  @ApiProperty({
    description: 'Total number of seasons',
    example: 8,
    type: Number,
    nullable: true,
  })
  @Expose()
  @IsInt()
  numberOfSeasons: number | null;

  @ApiProperty({
    description: 'Indicates if the TV series is still in production',
    example: false,
    type: Boolean,
    nullable: true,
  })
  @Expose()
  @IsBoolean()
  inProduction: boolean | null;

  @ApiProperty({
    description: 'Original language of the TV series',
    example: 'en',
    type: String,
    nullable: true,
  })
  @Expose()
  @IsString()
  originalLanguage: string | null;

  @ApiProperty({
    description: 'Original name of the TV series',
    example: 'Game of Thrones',
    type: String,
    nullable: true,
  })
  @Expose()
  @IsString()
  originalName: string | null;

  @ApiProperty({
    description: 'Status of the TV series',
    example: 'Ended',
    type: String,
    nullable: true,
  })
  @Expose()
  @IsString()
  status: string | null;

  @ApiProperty({
    description: 'Type of the TV series (e.g., Scripted, Miniseries)',
    example: 'Scripted',
    type: String,
    nullable: true,
  })
  @Expose()
  @IsString()
  type: string | null;

  @ApiProperty({
    description: 'Popularity score of the TV series',
    example: 369.594,
    type: Number,
    nullable: false,
  })
  @Expose()
  @IsNumber()
  popularity: number;

  @ApiProperty({
    description: 'Vote average of the TV series',
    example: 8.442,
    type: Number,
    nullable: false,
  })
  @Expose()
  @IsNumber()
  voteAverage: number;

  @ApiProperty({
    description: 'Vote count of the TV series',
    example: 22881,
    type: Number,
    nullable: false,
  })
  @Expose()
  @IsInt()
  voteCount: number;

  @ApiProperty({
    description: 'Slug of the TV series',
    example: '1399-game-of-thrones',
    type: String,
    nullable: true,
  })
  @Expose()
  @IsString()
  slug: string | null;

  @ApiProperty({
    description: 'URL to the TV series page',
    example: '/tv-series/1399-game-of-thrones',
    type: String,
    nullable: true,
  })
  @Expose()
  @IsUrl()
  url: string | null;

  @ApiProperty({
    description: 'Followers average rating of the TV series',
    example: 9.5,
    type: Number,
    nullable: true,
  })
  @Expose()
  @IsNumber()
  followerAvgRating: number | null;
}

@ApiSchema({ name: 'TvSeriesCompact' })
export class TvSeriesCompactDto extends PickType(TvSeriesDto, [
  'id',
  'name',
  'slug',
  'url',
  'posterPath',
  'backdropPath',
  'createdBy',
  'firstAirDate',
  'lastAirDate',
  'voteAverage',
  'voteCount',
  'genres',
  'followerAvgRating',
] as const) {}

@ApiSchema({ name: 'TvSeriesMinimal' })
export class TvSeriesMinimalDto extends PickType(TvSeriesDto, [
  'id',
  'name',
  'slug',
  'url',
] as const) {}

@ApiSchema({ name: 'TvSeriesTrailer' })
export class TvSeriesTrailerDto {
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
