import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsInt,
  IsString,
  IsUrl,
  IsNumber,
  IsDateString,
} from 'class-validator';


@ApiSchema({ name: 'TvEpisode' })
export class TvEpisodeDto {
  @ApiProperty({
    description: "The TV episode's unique identifier",
    example: 1399,
  })
  @Expose()
  @IsInt()
  id: number;

  @ApiProperty({
    description: 'The season ID this episode belongs to',
    example: 1,
  })
  @Expose()
  @IsInt()
  tvSeasonId: number;

  @ApiProperty({
    description: 'The TV series ID this episode belongs to',
    example: 1399,
  })
  @Expose()
  @IsInt()
  tvSeriesId: number;

  @ApiProperty({
    description: 'The season number this episode belongs to',
    example: 1,
  })
  @Expose()
  @IsInt()
  seasonNumber: number;

  @ApiProperty({ example: 1 })
  @Expose()
  @IsInt()
  episodeNumber: number;

  @ApiProperty({
    description: 'The date the episode first aired',
    example: '2011-04-17',
    type: String,
    nullable: true,
  })
  @Expose()
  @IsDateString()
  airDate: string | null;

  @ApiProperty({
    description: 'The name of the TV episode',
    example: 'Winter Is Coming',
    type: String,
    nullable: true,
  })
  @Expose()
  @IsString()
  name: string | null;

  @ApiProperty({ example: 'standard', nullable: true })
  @Expose()
  @IsString()
  episodeType: string | null;

  @ApiProperty({
    description: 'Overview of the TV episode',
    example:
      'Seven noble families fight for control of the mythical land of Westeros.',
    type: String,
    nullable: true,
  })
  @Expose()
  @IsString()
  overview: string | null;

  @ApiProperty({ example: 60 })
  @Expose()
  @IsInt()
  runtime: number;

  @ApiProperty({ example: '101', nullable: true })
  @Expose()
  @IsString()
  productionCode: string | null;

  @ApiProperty({
    description: 'Still path of the TV episode',
    example: '/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg',
    type: String,
    nullable: true,
  })
  @Expose()
  @IsString()
  stillPath: string | null;

  @ApiProperty({
    description: 'Vote average of the TV season',
    example: 8.442,
    type: Number,
    nullable: false,
  })
  @Expose()
  @IsNumber()
  voteAverage: number;

  @ApiProperty({
    description: 'Vote count of the TV season',
    example: 22881,
    type: Number,
    nullable: false,
  })
  @Expose()
  @IsInt()
  voteCount: number;

  @ApiProperty({
    description: 'URL to the TV season page',
    example: '/tv-series/1399-game-of-thrones/season/1',
    type: String,
    nullable: true,
  })
  @Expose()
  @IsUrl()
  url: string | null;
}