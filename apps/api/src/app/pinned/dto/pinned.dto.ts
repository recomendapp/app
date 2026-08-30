import { ApiProperty, ApiSchema, getSchemaPath } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsDateString, IsIn, IsInt, Min } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { pinnedItemTypeEnum } from '@libs/db/schemas';
import { MovieCompactDto } from '../../movies/dto/movies.dto';
import { TvSeriesCompactDto } from '../../tv-series/dto/tv-series.dto';
import { PlaylistDto } from '../../playlists/dto/playlists.dto';
import { PersonCompactDto } from '../../persons/dto/persons.dto';
import { IsNullable } from '../../../common/decorators/is-nullable.decorator';
import { ApiErrorDto } from '../../../common/dto/api-error.dto';

export enum PinnedItemStatus {
  AVAILABLE = 'available',
  // Playlist-only: the underlying playlist still exists but is no longer accessible (made
  // private, membership revoked, ...). `data` is null in this case.
  UNAVAILABLE = 'unavailable',
  // The item's content is fine and `data` is populated, but it currently sits beyond the
  // profile's active plan limit (e.g. a downgraded ex-premium user with more than 4 pins) — it's
  // only ever returned to the owner's own management view, so a UI can grey it out.
  OVER_LIMIT = 'over_limit',
}

@ApiSchema({ name: 'PinnedItem' })
export class PinnedItemDto {
  @ApiProperty({ example: 42 })
  @Expose()
  @IsInt()
  id!: number;

  @ApiProperty({ example: 'user-uuid-123' })
  @Expose()
  userId!: string;

  @ApiProperty({ example: '0|i0000r:' })
  @Expose()
  rank!: string;

  @ApiProperty({
    description: 'The type of the pinned item',
    enum: pinnedItemTypeEnum.enumValues,
    example: pinnedItemTypeEnum.enumValues[0],
  })
  @Expose()
  @IsIn(pinnedItemTypeEnum.enumValues, {
    message: `Type must be one of: ${pinnedItemTypeEnum.enumValues.join(', ')}`,
  })
  type!: (typeof pinnedItemTypeEnum.enumValues)[number];

  @ApiProperty({ example: '2024-01-30T12:00:00Z' })
  @Expose()
  @IsDateString()
  createdAt!: string;

  @ApiProperty({ example: '2024-01-30T12:00:00Z' })
  @Expose()
  @IsDateString()
  updatedAt!: string;
}

/* ---------------------------------- Types --------------------------------- */
@ApiSchema({ name: 'PinnedItemWithMovie' })
export class PinnedItemWithMovieDto extends PinnedItemDto {
  @ApiProperty({ enum: ['movie'] as const })
  @Expose()
  type!: 'movie';

  @ApiProperty({
    description:
      '"over_limit" means this item currently sits beyond the profile\'s active plan ' +
      "limit (e.g. a downgraded ex-premium user's 5th+ pin) — only ever returned to the owner's " +
      'own management view, so a UI can grey it out.',
    enum: PinnedItemStatus,
  })
  @Expose()
  @IsIn(Object.values(PinnedItemStatus))
  status!: PinnedItemStatus;

  @ApiProperty({ type: () => MovieCompactDto })
  @Expose()
  @Type(() => MovieCompactDto)
  data!: MovieCompactDto;
}

@ApiSchema({ name: 'PinnedItemWithTvSeries' })
export class PinnedItemWithTvSeriesDto extends PinnedItemDto {
  @ApiProperty({ enum: ['tv_series'] as const })
  @Expose()
  type!: 'tv_series';

  @ApiProperty({
    description:
      '"over_limit" means this item currently sits beyond the profile\'s active plan ' +
      "limit (e.g. a downgraded ex-premium user's 5th+ pin) — only ever returned to the owner's " +
      'own management view, so a UI can grey it out.',
    enum: PinnedItemStatus,
  })
  @Expose()
  @IsIn(Object.values(PinnedItemStatus))
  status!: PinnedItemStatus;

  @ApiProperty({ type: () => TvSeriesCompactDto })
  @Expose()
  @Type(() => TvSeriesCompactDto)
  data!: TvSeriesCompactDto;
}

@ApiSchema({ name: 'PinnedItemWithPlaylist' })
export class PinnedItemWithPlaylistDto extends PinnedItemDto {
  @ApiProperty({ enum: ['playlist'] as const })
  @Expose()
  type!: 'playlist';

  @ApiProperty({
    description:
      '"unavailable" means the playlist still exists but the viewer (or, for the ' +
      "owner's own management view, the profile owner) no longer has permission to see it — e.g. " +
      'it was made private ; `data` is null in that case. "over_limit" means the playlist is ' +
      "fine and `data` is populated, but this pin currently sits beyond the profile's active " +
      "plan limit — only ever returned to the owner's own management view, so a UI can grey it out.",
    enum: PinnedItemStatus,
  })
  @Expose()
  @IsIn(Object.values(PinnedItemStatus))
  status!: PinnedItemStatus;

  @ApiProperty({
    type: () => PlaylistDto,
    nullable: true,
    description: 'Null when status is "unavailable"',
  })
  @Expose()
  @IsNullable()
  @Type(() => PlaylistDto)
  data!: PlaylistDto | null;
}

@ApiSchema({ name: 'PinnedItemWithPerson' })
export class PinnedItemWithPersonDto extends PinnedItemDto {
  @ApiProperty({ enum: ['person'] as const })
  @Expose()
  type!: 'person';

  @ApiProperty({
    description:
      '"over_limit" means this item currently sits beyond the profile\'s active plan ' +
      "limit (e.g. a downgraded ex-premium user's 5th+ pin) — only ever returned to the owner's " +
      'own management view, so a UI can grey it out.',
    enum: PinnedItemStatus,
  })
  @Expose()
  @IsIn(Object.values(PinnedItemStatus))
  status!: PinnedItemStatus;

  @ApiProperty({ type: () => PersonCompactDto })
  @Expose()
  @Type(() => PersonCompactDto)
  data!: PersonCompactDto;
}

export type PinnedItemUnion =
  | PinnedItemWithMovieDto
  | PinnedItemWithTvSeriesDto
  | PinnedItemWithPlaylistDto
  | PinnedItemWithPersonDto;

export const PINNED_ITEM_UNION_SCHEMA = {
  title: 'PinnedItemUnion',
  oneOf: [
    { $ref: getSchemaPath(PinnedItemWithMovieDto) },
    { $ref: getSchemaPath(PinnedItemWithTvSeriesDto) },
    { $ref: getSchemaPath(PinnedItemWithPlaylistDto) },
    { $ref: getSchemaPath(PinnedItemWithPersonDto) },
  ],
  discriminator: {
    propertyName: 'type',
    mapping: {
      movie: getSchemaPath(PinnedItemWithMovieDto),
      tv_series: getSchemaPath(PinnedItemWithTvSeriesDto),
      playlist: getSchemaPath(PinnedItemWithPlaylistDto),
      person: getSchemaPath(PinnedItemWithPersonDto),
    },
  },
};

export const PINNED_ITEM_LIST_SCHEMA = {
  type: 'array' as const,
  items: PINNED_ITEM_UNION_SCHEMA, // On réutilise le schéma avec le title
};
/* -------------------------------------------------------------------------- */

// Create
@ApiSchema({ name: 'PinnedItemCreate' })
export class PinnedItemCreateDto {
  @ApiProperty({
    description: 'The type of item to pin',
    enum: pinnedItemTypeEnum.enumValues,
    example: pinnedItemTypeEnum.enumValues[0],
  })
  @IsIn(pinnedItemTypeEnum.enumValues, {
    message: `Type must be one of: ${pinnedItemTypeEnum.enumValues.join(', ')}`,
  })
  type!: (typeof pinnedItemTypeEnum.enumValues)[number];

  @ApiProperty({
    example: 123456,
    description: 'The TMDB movie/tv series/person id, or the playlist id, depending on `type`',
  })
  @IsInt()
  mediaId!: number;
}

// Update (reorder)
@ApiSchema({ name: 'PinnedItemUpdate' })
export class PinnedItemUpdateDto {
  @ApiProperty({ description: 'The new absolute position in the pinned list (starts at 1)' })
  @IsInt()
  @Min(1)
  position!: number;
}

// Delete
@ApiSchema({ name: 'PinnedItemsDelete' })
export class PinnedItemsDeleteDto {
  @ApiProperty({
    description: 'Array of pinned item IDs to remove',
    example: [1, 42, 108],
    type: [Number],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  itemIds!: number[];
}

// Errors
@ApiSchema({ name: 'PinnedLimitReachedError' })
export class PinnedLimitReachedErrorDto extends ApiErrorDto {
  @ApiProperty({
    description:
      'Whether upgrading to premium would raise the pin limit and allow this item to ' +
      'be pinned. False means the user is already on the highest tier and must unpin something ' +
      'else first — the client should not send them to the upgrade page.',
  })
  upgradable!: boolean;
}
