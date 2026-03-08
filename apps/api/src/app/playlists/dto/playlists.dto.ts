import { ApiProperty, ApiPropertyOptional, ApiSchema, IntersectionType, PartialType, PickType } from "@nestjs/swagger";
import { Expose, Transform, Type } from "class-transformer";
import { IsDateString, IsEnum, IsIn, IsOptional, IsString, IsUrl, Length, Matches, ValidateNested } from "class-validator";
import { PLAYLIST_RULES } from "../../../config/validation-rules";
import { playlistMemberRoleEnum, playlistVisibilityEnum } from "@libs/db/schemas";
import { PaginatedResponseDto, PaginationQueryDto } from "../../../common/dto/pagination.dto";
import { UserSummaryDto } from "../../users/dto/users.dto";
import { IsNullable } from "../../../common/decorators/is-nullable.decorator";
import { SortOrder } from "../../../common/dto/sort.dto";
import { CursorPaginatedResponseDto, CursorPaginationQueryDto } from "../../../common/dto/cursor-pagination.dto";
import { getMediaUrl } from "../../../common/modules/storage/storage.utils";
import { StorageFolders } from "../../../common/modules/storage/storage.constants";

export enum PlaylistSortBy {
  CREATED_AT = 'created_at',
  UPDATED_AT = 'updated_at',
  LIKES_COUNT = 'likes_count',
  RANDOM = 'random',
}

@ApiSchema({ name: 'Playlist' })
export class PlaylistDto {
	@ApiProperty({ example: "123456", description: 'The unique ID of the Playlist' })
	@Expose()
	id: number;

	@ApiProperty({ example: "user-uuid-123", description: 'The ID of the owner' })
    @Expose()
    userId: string;

	@ApiProperty({
		example: "Where cats shine",
		description: 'The display title of the Playlist',
		minLength: PLAYLIST_RULES.TITLE.MIN,
        maxLength: PLAYLIST_RULES.TITLE.MAX,
	})
	@Expose()
	@IsString()
	@Length(PLAYLIST_RULES.TITLE.MIN, PLAYLIST_RULES.TITLE.MAX)
	@Matches(PLAYLIST_RULES.TITLE.REGEX, {
		message: 'Invalid title format'
	})
	title: string;

	@ApiProperty({
        example: "A collection of chill songs.",
        description: 'The description of the playlist',
        nullable: true,
        maxLength: PLAYLIST_RULES.DESCRIPTION.MAX,
    })
    @Expose()
    @IsString()
    @IsNullable()
    @Length(PLAYLIST_RULES.DESCRIPTION.MIN, PLAYLIST_RULES.DESCRIPTION.MAX)
    @Matches(PLAYLIST_RULES.DESCRIPTION.REGEX, {
        message: 'Description cannot be empty or contain excessive line breaks'
    })
    description: string | null;

	@ApiProperty({
        description: 'Who can see this playlist',
        enum: playlistVisibilityEnum.enumValues, 
        example: playlistVisibilityEnum.enumValues[0],
    })
    @Expose()
    @IsString()
    @IsIn(playlistVisibilityEnum.enumValues, {
        message: `Visibility must be one of: ${playlistVisibilityEnum.enumValues.join(', ')}`
    })
    visibility: typeof playlistVisibilityEnum.enumValues[number];

	@ApiProperty({ 
        example: "https://example.com/poster.jpg", 
        description: 'Cover image URL', 
        nullable: true 
    })
    @Expose()
    @Transform(({ value }) => getMediaUrl(value, StorageFolders.PLAYLIST_POSTERS))
    @IsUrl()
    poster: string | null;

	// Dates
	@ApiProperty()
    @Expose()
    @IsDateString()
    createdAt: string;

    @ApiProperty()
    @Expose()
    @IsDateString()
    updatedAt: string;

	// Counts
	@ApiProperty({ example: 42, description: 'Number of items in the playlist' })
	@Expose()
	itemsCount: number;

	@ApiProperty({ example: 100, description: 'Number of times the playlist has been saved' })
	@Expose()
	savedCount: number;
	
	@ApiProperty({ example: 250, description: 'Number of likes the playlist has received' })
	@Expose()
	likesCount: number;

    @ApiProperty({ 
        description: 'The role of the current user for this playlist', 
        enum: [...playlistMemberRoleEnum.enumValues, 'owner', null], 
        example: 'owner',
        nullable: true 
    })
    @Expose()
    @IsString()
    @IsNullable()
    role: typeof playlistMemberRoleEnum.enumValues[number] | 'owner' | null;
}

@ApiSchema({ name: 'PlaylistWithOwner' })
export class PlaylistWithOwnerDTO extends PlaylistDto {
    @ApiProperty({ type: () => UserSummaryDto, description: 'The user object' })
    @Expose()
    @ValidateNested()
    @Type(() => UserSummaryDto)
    owner: UserSummaryDto;
}

@ApiSchema({ name: 'BaseListPlaylistsQuery' })
class BaseListPlaylistsQueryDto {
    @ApiPropertyOptional({
        description: 'Field to sort playlists by',
        default: PlaylistSortBy.UPDATED_AT,
        example: PlaylistSortBy.UPDATED_AT,
        enum: PlaylistSortBy,
    })
    @IsOptional()
    @IsEnum(PlaylistSortBy)
    sort_by: PlaylistSortBy = PlaylistSortBy.UPDATED_AT;

    @ApiPropertyOptional({
        description: 'Sort order',
        default: SortOrder.DESC,
        example: SortOrder.DESC,
        enum: SortOrder,
    })
    @IsOptional()
    @IsEnum(SortOrder)
    sort_order: SortOrder = SortOrder.DESC;
}

@ApiSchema({ name: 'ListPaginatedPlaylistsQuery' })
export class ListPaginatedPlaylistsQueryDto extends IntersectionType(
  BaseListPlaylistsQueryDto,
  PaginationQueryDto
) {}

@ApiSchema({ name: 'ListInfinitePlaylistsQuery' })
export class ListInfinitePlaylistsQueryDto extends IntersectionType(
  BaseListPlaylistsQueryDto,
  CursorPaginationQueryDto
) {}

@ApiSchema({ name: 'PlaylistCreate' })
export class PlaylistCreateDto extends PickType(PlaylistDto, ['title', 'description', 'visibility'] as const) {}

@ApiSchema({ name: 'PlaylistUpdate' })
export class PlaylistUpdateDto extends PartialType(PlaylistCreateDto) {}

@ApiSchema({ name: 'ListPaginatedPlaylists' })
export class ListPaginatedPlaylistsDto extends PaginatedResponseDto<PlaylistDto> {
	@ApiProperty({ type: () => [PlaylistDto] })
	@Type(() => PlaylistDto)
	data: PlaylistDto[];

	constructor(partial: Partial<ListPaginatedPlaylistsDto>) {
		super(partial);
		Object.assign(this, partial);
	}
}

@ApiSchema({ name: 'ListInfinitePlaylists'})
export class ListInfinitePlaylistsDto extends CursorPaginatedResponseDto<PlaylistDto> {
  @ApiProperty({ type: () => [PlaylistDto] })
  @Type(() => PlaylistDto)
  data: PlaylistDto[];

  constructor(partial: Partial<ListInfinitePlaylistsDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}

@ApiSchema({ name: 'ListPaginatedPlaylistsWithOwner' })
export class ListPaginatedPlaylistsWithOwnerDto extends PaginatedResponseDto<PlaylistWithOwnerDTO> {
	@ApiProperty({ type: () => [PlaylistWithOwnerDTO] })
	@Type(() => PlaylistWithOwnerDTO)
	data: PlaylistWithOwnerDTO[];

	constructor(partial: Partial<ListPaginatedPlaylistsWithOwnerDto>) {
		super(partial);
		Object.assign(this, partial);
	}
}

@ApiSchema({ name: 'ListInfinitePlaylistsWithOwner'})
export class ListInfinitePlaylistsWithOwnerDto extends CursorPaginatedResponseDto<PlaylistWithOwnerDTO> {
  @ApiProperty({ type: () => [PlaylistWithOwnerDTO] })
  @Type(() => PlaylistWithOwnerDTO)
  data: PlaylistWithOwnerDTO[];

  constructor(partial: Partial<ListInfinitePlaylistsWithOwnerDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}