import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";

class BaseUser {
	@ApiProperty({ example: "ciud123", description: 'The unique ID of the user' })
	@Expose()
	id: string;

	@ApiProperty({ example: "Loup", description: 'The full name of the user' })
	@Expose()
	name: string;

	@ApiProperty({ example: "loup", description: 'The username of the user' })
	@Expose()
	username: string;

	@ApiProperty({ example: "Loup", description: 'The display username' })
	@Expose()
	displayUsername: string;

	@ApiProperty({ example: "Just a movie lover.", description: 'The bio of the user', nullable: true })
	@Expose()
	bio: string | null;

	@ApiProperty({ example: "https://example.com/avatar.jpg", description: 'The URL of the user avatar', nullable: true })
	@Expose()
	avatar: string | null;

	@ApiProperty({ example: "https://example.com/background.jpg", description: 'The URL of the user background image', nullable: true })
	@Expose()
	backgroundImage: string | null;

	@ApiProperty({ description: 'Whether the user has a premium account' })
	@Expose()
	isPremium: boolean;

	@ApiProperty({ description: 'Whether the user profile is private' })
	@Expose()
	isPrivate: boolean;

	@ApiProperty({ description: 'The number of followers the user has' })
	@Expose()
	followersCount: number;
	
	@ApiProperty({ description: 'The number of users this user is following' })
	@Expose()
	followingCount: number;

	@ApiProperty()
	@Expose()
	@Type(() => Date)
	createdAt: Date;
}

@ApiSchema({ name: 'UserMe' })
export class UserMeDto extends BaseUser {
	@ApiProperty({ example: 'loup@recomend.com' })
	@Expose()
	email: string;

	@ApiProperty()
	@Expose()
	emailVerified: boolean;

	@ApiProperty({ example: 'fr-FR' })
	@Expose()
	language: string;

	@ApiProperty()
	@Expose()
	@Type(() => Date)
	updatedAt: Date;

	@ApiProperty()
	@Expose()
	@Type(() => Date)
	usernameUpdatedAt?: Date | null;
}

@ApiSchema({ name: 'UserPublic' })
export class UserPublicDto extends BaseUser {
	@ApiProperty({ description: 'Whether the user profile is visilble by current user (if target user is private)' })
	@Expose()
	isVisible: boolean;
}