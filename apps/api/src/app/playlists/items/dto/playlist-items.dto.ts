import { ApiSchema, ApiProperty, PartialType, PickType, getSchemaPath, ApiPropertyOptional, ApiExtraModels, IntersectionType } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsIn, IsInt, IsOptional, IsString, MaxLength, Min, ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { playlistItemTypeEnum } from '@libs/db/schemas';
import { MovieCompactDto } from '../../../movies/dto/movies.dto';
import { TvSeriesCompactDto } from '../../../tv-series/dto/tv-series.dto';
import { PaginatedResponseDto, PaginationQueryDto } from '../../../../common/dto/pagination.dto';
import { SortOrder } from '../../../../common/dto/sort.dto';
import { CursorPaginatedResponseDto, CursorPaginationQueryDto } from '../../../../common/dto/cursor-pagination.dto';
import { PLAYLIST_ITEM_RULES } from '../../../../config/validation-rules';

export enum PlaylistItemSortBy {
  RANK = 'rank',
}

export enum PlaylistItemType {
  MOVIE = 'movie',
  TV_SERIES = 'tv_series',
}

@ApiSchema({ name: 'PlaylistItem' })
export class PlaylistItemDto {
  @ApiProperty({ example: 42 })
  @Expose()
  @IsInt()
  id: number;

  @ApiProperty({ example: 123456 })
  @Expose()
  @IsInt()
  playlistId: number;

  @ApiProperty({ example: 'user-uuid-123' })
  @Expose()
  userId: string;

  @ApiProperty({
	example: 'Must watch this weekend',
	nullable: true,
	maxLength: PLAYLIST_ITEM_RULES.COMMENT.MAX,
  })
  @Expose()
  @IsOptional()
  @IsString()
  @MaxLength(PLAYLIST_ITEM_RULES.COMMENT.MAX)
  comment: string | null;

  @ApiProperty({ example: 1 })
  @Expose()
  @IsInt()
  @Min(1)
  rank: number;

  @ApiProperty({ example: 123456 })
  @Expose()
  @IsInt()
  mediaId: number;

  @ApiProperty({
	  description: 'The type of the playlist item',
	  enum: playlistItemTypeEnum.enumValues, 
	  example: playlistItemTypeEnum.enumValues[0],
  })
  @Expose()
  @IsString()
  @IsIn(playlistItemTypeEnum.enumValues, {
	  message: `Type must be one of: ${playlistItemTypeEnum.enumValues.join(', ')}`
  })
  type: typeof playlistItemTypeEnum.enumValues[number];

  @ApiProperty({ example: '2024-01-30T12:00:00Z' })
  @Expose()
  @IsDateString()
  createdAt: string;

  @ApiProperty({ example: '2024-01-30T12:00:00Z' })
  @Expose()
  @IsDateString()
  updatedAt: string;

  constructor(data: PlaylistItemDto) {
	Object.assign(this, data);
  }
}

/* ---------------------------------- Types --------------------------------- */
@ApiSchema({ name: 'PlaylistItemWithMovie' })
export class PlaylistItemWithMovieDto extends PlaylistItemDto {
  @ApiProperty({ enum: ['movie'] as const })
  @Expose()
  type: 'movie';

  @ApiProperty({ type: () => MovieCompactDto })
  @Expose()
  @ValidateNested()
  @Type(() => MovieCompactDto)
  media: MovieCompactDto;
}

@ApiSchema({ name: 'PlaylistItemWithTvSeries' })
export class PlaylistItemWithTvSeriesDto extends PlaylistItemDto {
  @ApiProperty({ enum: ['tv_series'] as const })
  @Expose()
  type: 'tv_series';

  @ApiProperty({ type: () => TvSeriesCompactDto })
  @Expose()
  @ValidateNested()
  @Type(() => TvSeriesCompactDto)
  media: TvSeriesCompactDto;
}

export type PlaylistItemWithMediaUnion = PlaylistItemWithMovieDto | PlaylistItemWithTvSeriesDto;
/* -------------------------------------------------------------------------- */

@ApiSchema({ name: 'PlaylistItemInput' })
export class PlaylistItemInputDto extends PartialType(PickType(PlaylistItemDto, ['rank', 'comment'] as const)) {}

@ApiSchema({ name: 'BaseListPlaylistItemsQuery' })
export class BaseListPlaylistItemsQueryDto {
	@ApiPropertyOptional({
	  description: 'Filter playlist items by type',
	  enum: playlistItemTypeEnum.enumValues,
	})
	@IsOptional()
	@IsIn(playlistItemTypeEnum.enumValues, {
	  message: `Type must be one of: ${playlistItemTypeEnum.enumValues.join(', ')}`
	})
	type?: typeof playlistItemTypeEnum.enumValues[number];

	@ApiPropertyOptional({
		description: 'Field to sort playlist items by',
		default: PlaylistItemSortBy.RANK,
		example: PlaylistItemSortBy.RANK,
		enum: PlaylistItemSortBy,
	})
	@IsOptional()
	@IsEnum(PlaylistItemSortBy)
	sort_by: PlaylistItemSortBy = PlaylistItemSortBy.RANK;

	@ApiPropertyOptional({
		description: 'Sort order',
		default: SortOrder.ASC,
		example: SortOrder.ASC,
		enum: SortOrder,
	})
	@IsOptional()
	@IsEnum(SortOrder)
	sort_order: SortOrder = SortOrder.ASC;
}

@ApiSchema({ name: 'ListAllPlaylistItemsQuery' })
export class ListAllPlaylistItemsQueryDto extends BaseListPlaylistItemsQueryDto {}

@ApiSchema({ name: 'ListPaginatedPlaylistItemsQuery' })
export class ListPaginatedPlaylistItemsQueryDto extends IntersectionType(
  BaseListPlaylistItemsQueryDto,
  PaginationQueryDto
) {}

@ApiSchema({ name: 'ListInfinitePlaylistItemsQuery' })
export class ListInfinitePlaylistItemsQueryDto extends IntersectionType(
  BaseListPlaylistItemsQueryDto,
  CursorPaginationQueryDto
) {}

@ApiExtraModels(PlaylistItemWithMovieDto, PlaylistItemWithTvSeriesDto)
@ApiSchema({ name: 'ListPaginatedPlaylistItems' })
export class ListPaginatedPlaylistItemsDto extends PaginatedResponseDto<PlaylistItemWithMediaUnion> {
  @ApiProperty({
	type: 'array',
	items: {
	  oneOf: [
		{ $ref: getSchemaPath(PlaylistItemWithMovieDto) },
		{ $ref: getSchemaPath(PlaylistItemWithTvSeriesDto) },
	  ],
	  discriminator: {
		propertyName: 'type',
		mapping: {
		  movie: getSchemaPath(PlaylistItemWithMovieDto),
		  tv_series: getSchemaPath(PlaylistItemWithTvSeriesDto),
		},
	  },
	},
  })
  @Type(() => PlaylistItemDto, {
	keepDiscriminatorProperty: true,
	discriminator: {
	  property: 'type',
	  subTypes: [
		{ value: PlaylistItemWithMovieDto, name: 'movie' },
		{ value: PlaylistItemWithTvSeriesDto, name: 'tv_series' },
	  ],
	},
  })
  data: PlaylistItemWithMediaUnion[];

  constructor(partial: Partial<ListPaginatedPlaylistItemsDto>) {
	super(partial);
	Object.assign(this, partial);
  }
}

@ApiExtraModels(PlaylistItemWithMovieDto, PlaylistItemWithTvSeriesDto)
@ApiSchema({ name: 'ListInfinitePlaylistItems'})
export class ListInfinitePlaylistItemsDto extends CursorPaginatedResponseDto<PlaylistItemWithMediaUnion> {
  @ApiProperty({
	type: 'array',
	items: {
	  oneOf: [
		{ $ref: getSchemaPath(PlaylistItemWithMovieDto) },
		{ $ref: getSchemaPath(PlaylistItemWithTvSeriesDto) },
	  ],
	  discriminator: {
		propertyName: 'type',
		mapping: {
		  movie: getSchemaPath(PlaylistItemWithMovieDto),
		  tv_series: getSchemaPath(PlaylistItemWithTvSeriesDto),
		},
	  },
	},
  })
  @Type(() => PlaylistItemDto, {
	keepDiscriminatorProperty: true,
	discriminator: {
	  property: 'type',
	  subTypes: [
		{ value: PlaylistItemWithMovieDto, name: 'movie' },
		{ value: PlaylistItemWithTvSeriesDto, name: 'tv_series' },
	  ],
	},
  })
  data: PlaylistItemWithMediaUnion[];

  constructor(partial: Partial<ListInfinitePlaylistItemsDto>) {
	super(partial);
	Object.assign(this, partial);
  }
}