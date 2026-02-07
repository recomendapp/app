import { ApiProperty, ApiSchema, PartialType, PickType } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { IsIn, IsString, IsUrl, Length, Matches } from "class-validator";
import { PLAYLIST_RULES } from "../../../config/validation-rules";
import { playlistVisibilityEnum } from "@libs/core/schemas";
import { PaginatedResponseDto } from "../../../common/dto/pagination.dto";

@ApiSchema({ name: 'Playlist' })
export class PlaylistDTO {
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
    visibility: string;

	@ApiProperty({ 
        example: "https://example.com/poster.jpg", 
        description: 'Cover image URL', 
        nullable: true 
    })
    @Expose()
    @IsUrl()
    poster: string | null;

	// Dates
	@ApiProperty()
    @Expose()
    @Type(() => Date)
    createdAt: Date;

    @ApiProperty()
    @Expose()
    @Type(() => Date)
    updatedAt: Date;

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
}

@ApiSchema({ name: 'UpdatePlaylist' })
export class UpdatePlaylistDto extends PartialType(PickType(PlaylistDTO, ['title', 'description', 'visibility'] as const)) {}

@ApiSchema({ name: 'ListPlaylists' })
export class ListPlaylistsDto extends PaginatedResponseDto<PlaylistDTO> {
	@ApiProperty({ type: () => [PlaylistDTO] })
	@Type(() => PlaylistDTO)
	data: PlaylistDTO[];

	constructor(partial: Partial<ListPlaylistsDto>) {
		super(partial);
		Object.assign(this, partial);
	}
}