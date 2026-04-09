import { ApiSchema, ApiProperty, ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUrl } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { PaginatedResponseDto, PaginationQueryDto } from '../../../../common/dto/pagination.dto';
import { SortOrder } from '../../../../common/dto/sort.dto';
import { CursorPaginatedResponseDto, CursorPaginationQueryDto } from '../../../../common/dto/cursor-pagination.dto';

export enum TvEpisodeSortBy {
  EPISODE_NUMBER = 'episode_number',
  AIR_DATE = 'air_date',
}

@ApiSchema({ name: 'TvEpisode' })
export class TvEpisodeDto {
  @ApiProperty({ description: "The TV episode's unique identifier", example: 1399 })
  @Expose()
  @IsInt()
  id!: number;

  @ApiProperty({ description: 'The season ID this episode belongs to', example: 1 })
  @Expose()
  @IsInt()
  tvSeasonId!: number;

  @ApiProperty({ description: 'The TV series ID this episode belongs to', example: 1399 })
  @Expose()
  @IsInt()
  tvSeriesId!: number;

  @ApiProperty({ description: 'The season number this episode belongs to', example: 1 })
  @Expose()
  @IsInt()
  seasonNumber!: number;

  @ApiProperty({ example: 1 })
  @Expose()
  @IsInt()
  episodeNumber!: number;

  @ApiProperty({ description: 'The date the episode first aired', example: '2011-04-17', type: String, nullable: true })
  @Expose()
  @IsDateString()
  airDate!: string | null;

  @ApiProperty({ description: 'The name of the TV episode', example: 'Winter Is Coming', type: String, nullable: true })
  @Expose()
  @IsString()
  name!: string | null;

  @ApiProperty({ example: 'standard', nullable: true })
  @Expose()
  @IsString()
  episodeType!: string | null;

  @ApiProperty({ description: 'Overview of the TV episode', example: 'Seven noble families fight...', type: String, nullable: true })
  @Expose()
  @IsString()
  overview!: string | null;

  @ApiProperty({ example: 60 })
  @Expose()
  @IsInt()
  runtime!: number;

  @ApiProperty({ example: '101', nullable: true })
  @Expose()
  @IsString()
  productionCode!: string | null;

  @ApiProperty({ description: 'Still path of the TV episode', example: '/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg', type: String, nullable: true })
  @Expose()
  @IsString()
  stillPath!: string | null;

  @ApiProperty({ description: 'Vote average of the TV season', example: 8.442, type: Number, nullable: false })
  @Expose()
  @IsNumber()
  voteAverage!: number;

  @ApiProperty({ description: 'Vote count of the TV season', example: 22881, type: Number, nullable: false })
  @Expose()
  @IsInt()
  voteCount!: number;

  @ApiProperty({ description: 'URL to the TV season page', example: '/tv-series/1399-game-of-thrones/season/1/episode/1', type: String, nullable: true })
  @Expose()
  @IsUrl()
  url!: string | null;

  constructor(data: TvEpisodeDto) {
    Object.assign(this, data);
  }
}

@ApiSchema({ name: 'BaseListTvEpisodesQuery' })
export class BaseListTvEpisodesQueryDto {
  @ApiPropertyOptional({
    description: 'Field to sort episodes by',
    default: TvEpisodeSortBy.EPISODE_NUMBER,
    enum: TvEpisodeSortBy,
  })
  @IsOptional()
  @IsEnum(TvEpisodeSortBy)
  sort_by: TvEpisodeSortBy = TvEpisodeSortBy.EPISODE_NUMBER;

  @ApiPropertyOptional({
    description: 'Sort order',
    default: SortOrder.ASC,
    enum: SortOrder,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sort_order: SortOrder = SortOrder.ASC;
}

@ApiSchema({ name: 'ListAllTvEpisodesQuery' })
export class ListAllTvEpisodesQueryDto extends BaseListTvEpisodesQueryDto {}

@ApiSchema({ name: 'ListPaginatedTvEpisodesQuery' })
export class ListPaginatedTvEpisodesQueryDto extends IntersectionType(
  BaseListTvEpisodesQueryDto,
  PaginationQueryDto
) {}

@ApiSchema({ name: 'ListInfiniteTvEpisodesQuery' })
export class ListInfiniteTvEpisodesQueryDto extends IntersectionType(
  BaseListTvEpisodesQueryDto,
  CursorPaginationQueryDto
) {}

@ApiSchema({ name: 'ListPaginatedTvEpisodes' })
export class ListPaginatedTvEpisodesDto extends PaginatedResponseDto<TvEpisodeDto> {
  @ApiProperty({ type: [TvEpisodeDto] })
  @Type(() => TvEpisodeDto)
  data!: TvEpisodeDto[];

  constructor(partial: Partial<ListPaginatedTvEpisodesDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}

@ApiSchema({ name: 'ListInfiniteTvEpisodes'})
export class ListInfiniteTvEpisodesDto extends CursorPaginatedResponseDto<TvEpisodeDto> {
  @ApiProperty({ type: [TvEpisodeDto] })
  @Type(() => TvEpisodeDto)
  data!: TvEpisodeDto[];

  constructor(partial: Partial<ListInfiniteTvEpisodesDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}