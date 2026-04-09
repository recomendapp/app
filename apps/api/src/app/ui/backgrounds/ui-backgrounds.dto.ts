import { ApiSchema, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { uiBackgroundTypeEnum } from '@libs/db/schemas';
import { MovieCompactDto } from '../../movies/dto/movies.dto';
import { TvSeriesCompactDto } from '../../tv-series/dto/tv-series.dto';

export enum UiBackgroundSortBy {
  RANDOM = 'random',
  CREATED_AT = 'created_at',
}

@ApiSchema({ name: 'UiBackground' })
export class UiBackgroundDto {
  @ApiProperty({ example: 'uuid-1234-5678' })
  @Expose()
  @IsString()
  id!: string;

  @ApiProperty({ example: '/path/to/image.jpg' })
  @Expose()
  @IsString()
  filePath!: string;

  @ApiProperty({
      description: 'The type of the media',
      enum: uiBackgroundTypeEnum.enumValues, 
      example: uiBackgroundTypeEnum.enumValues[0],
  })
  @Expose()
  @IsString()
  @IsIn(uiBackgroundTypeEnum.enumValues)
  type!: typeof uiBackgroundTypeEnum.enumValues[number];

  @ApiProperty({ example: 123456 })
  @Expose()
  mediaId!: number;

  constructor(data: UiBackgroundDto) {
    Object.assign(this, data);
  }
}

/* ---------------------------------- Types --------------------------------- */
@ApiSchema({ name: 'UiBackgroundWithMovie' })
export class UiBackgroundWithMovieDto extends UiBackgroundDto {
  @ApiProperty({ enum: ['movie'] as const })
  @Expose()
  type!: 'movie';

  @ApiProperty({ type: () => MovieCompactDto })
  @Expose()
  @ValidateNested()
  @Type(() => MovieCompactDto)
  media!: MovieCompactDto;
}

@ApiSchema({ name: 'UiBackgroundWithTvSeries' })
export class UiBackgroundWithTvSeriesDto extends UiBackgroundDto {
  @ApiProperty({ enum: ['tv_series'] as const })
  @Expose()
  type!: 'tv_series';

  @ApiProperty({ type: () => TvSeriesCompactDto })
  @Expose()
  @ValidateNested()
  @Type(() => TvSeriesCompactDto)
  media!: TvSeriesCompactDto;
}

export type UiBackgroundWithMediaUnion = UiBackgroundWithMovieDto | UiBackgroundWithTvSeriesDto;
/* -------------------------------------------------------------------------- */

@ApiSchema({ name: 'BaseListUiBackgroundsQuery' })
export class BaseListUiBackgroundsQueryDto {
    @ApiPropertyOptional({
      description: 'Filter backgrounds by type',
      enum: uiBackgroundTypeEnum.enumValues,
    })
    @IsOptional()
    @IsIn(uiBackgroundTypeEnum.enumValues)
    type?: typeof uiBackgroundTypeEnum.enumValues[number];
}

@ApiSchema({ name: 'ListAllUiBackgroundsQuery' })
export class ListAllUiBackgroundsQueryDto extends BaseListUiBackgroundsQueryDto {}
