import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsInt,
  IsString,
  IsUrl,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { TvSeriesCompactDto } from '../../dto/tv-series.dto';


@ApiSchema({ name: 'TvSeason' })
export class TvSeasonDto {
  @ApiProperty({
    description: "The TV season's unique identifier",
    example: 1399,
  })
  @Expose()
  @IsInt()
  id: number;

  @ApiProperty({
    description: 'The TV series ID this season belongs to',
    example: 1399,
  })
  @Expose()
  @IsInt()
  tvSeriesId: number;

  @ApiProperty({
    description: 'The season number',
    example: 1,
  })
  @Expose()
  @IsInt()
  seasonNumber: number;

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
    description: 'Overview of the TV season',
    example:
      'Seven noble families fight for control of the mythical land of Westeros.',
    type: String,
    nullable: true,
  })
  @Expose()
  @IsString()
  overview: string | null;


  @ApiProperty({
    description: 'Poster path of the TV season',
    example: '/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg',
    type: String,
    nullable: true,
  })
  @Expose()
  @IsString()
  posterPath: string | null;

  @ApiProperty({
    description: 'The number of episodes in the TV season',
    example: 8,
    type: Number,
    nullable: false,
  })
  @Expose()
  @IsInt()
  episodeCount: number;

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

@ApiSchema({ name: 'TvSeasonGet' })
export class TvSeasonGetDTO extends TvSeasonDto {
    @ApiProperty({ type: () => TvSeriesCompactDto, description: 'The TV series object' })
    @Expose()
    @ValidateNested({ each: true })
    @Type(() => TvSeriesCompactDto)
    tvSeries: TvSeriesCompactDto;
}
