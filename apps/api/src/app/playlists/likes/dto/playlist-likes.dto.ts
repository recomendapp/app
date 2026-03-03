import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";

@ApiSchema({ name: 'PlaylistLike' })
export class PlaylistLikeDto {
	@ApiProperty({ example: "52", description: 'The ID of the playlist' })
	@Expose()
	playlistId: number;
	
	@ApiProperty({ example: "user-uuid-123", description: 'The ID of the user who saved the playlist' })
	@Expose()
	userId: string;

	// Dates
	@ApiProperty()
	@Expose()
	@Type(() => Date)
	createdAt: Date;
}