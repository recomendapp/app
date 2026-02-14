import { ApiProperty, ApiSchema, PickType } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { IsIn, IsString, ValidateNested } from "class-validator";
import { playlistMemberRoleEnum } from "@libs/db/schemas";
import { UserSummaryDto } from "../../users/dto/users.dto";

@ApiSchema({ name: 'PlaylistMember' })
export class PlaylistMemberDto {
	@ApiProperty({ example: "123456", description: 'The unique ID of the member' })
	@Expose()
	id: number;

	@ApiProperty({ example: "52", description: 'The ID of the playlist' })
	@Expose()
	playlistId: number;
	
	@ApiProperty({ example: "user-uuid-123", description: 'The ID of the member' })
	@Expose()
	userId: string;

	@ApiProperty({
        description: 'The role of the member in the playlist',
        enum: playlistMemberRoleEnum.enumValues, 
        example: playlistMemberRoleEnum.enumValues[0],
    })
    @Expose()
    @IsString()
    @IsIn(playlistMemberRoleEnum.enumValues, {
        message: `Role must be one of: ${playlistMemberRoleEnum.enumValues.join(', ')}`
    })
    role: typeof playlistMemberRoleEnum.enumValues[number];

	// Dates
	@ApiProperty()
    @Expose()
    @Type(() => Date)
    createdAt: Date;
}

class PlaylistMemberFullDto extends PlaylistMemberDto {
	@ApiProperty({ type: () => UserSummaryDto, description: 'The user object' })
	@Expose()
	@ValidateNested()
	@Type(() => UserSummaryDto)
	user: UserSummaryDto;
}

@ApiSchema({ name: 'PlaylistMemberInput' })
export class PlaylistMemberInputDto extends PickType(PlaylistMemberDto, [
    'userId',
    'role'
] as const) {}

@ApiSchema({ name: 'PlaylistMemberUpdate' })
export class PlaylistMemberUpdateDto {
	@ApiProperty({
		description: 'The list of members to update, add or remove from the playlist. To remove a member, simply exclude them from the list.',
		type: [PlaylistMemberInputDto],
	})
	@ValidateNested({ each: true })
	@Type(() => PlaylistMemberInputDto)
	members: PlaylistMemberInputDto[];
}

@ApiSchema({ name: 'PlaylistMemberList' })
export class PlaylistMemberListDto {
	@ApiProperty({
		description: 'The list of members in the playlist. Only includes members if the current user is an editor or the owner.',
		type: [PlaylistMemberFullDto],
	})
	@ValidateNested({ each: true })
	@Type(() => PlaylistMemberFullDto)
	members: PlaylistMemberFullDto[];
}
