import { ApiProperty, ApiPropertyOptional, ApiSchema, IntersectionType, PartialType, PickType } from "@nestjs/swagger";
import { USER_RULES } from '../../../config/validation-rules';
import { Expose, Transform, Type } from "class-transformer";
import { IsEnum, IsLocale, IsOptional, IsString, IsUrl, Length, Matches } from "class-validator";
import { PaginatedResponseDto, PaginationQueryDto } from "../../../common/dto/pagination.dto";
import { SortOrder } from "../../../common/dto/sort.dto";
import { CursorPaginatedResponseDto, CursorPaginationQueryDto } from "../../../common/dto/cursor-pagination.dto";

export enum UserSortBy {
  CREATED_AT = 'created_at',
  FOLLOWERS_COUNT = 'followers_count',
  RANDOM = 'random',
}

@ApiSchema({ name: 'User' })
export class UserDto {
	@ApiProperty({ example: "ciud123", description: 'The unique ID of the user' })
	@Expose()
	id: string;

	@ApiProperty({
		example: "Loooooup",
		description: 'The display name of the user',
		minLength: USER_RULES.NAME.MIN,
        maxLength: USER_RULES.NAME.MAX,
	})
	@Expose()
	@IsString()
	@Length(USER_RULES.NAME.MIN, USER_RULES.NAME.MAX)
	@Matches(USER_RULES.NAME.REGEX, {
		message: 'Invalid name format'
	})
	name: string;

	@ApiProperty({
		example: "loup",
		description: 'The username of the user',
		minLength: USER_RULES.USERNAME.MIN,
        maxLength: USER_RULES.USERNAME.MAX,
	})
	@Expose()
	@Transform(({ value }) => typeof value === 'string' ? USER_RULES.USERNAME.normalization(value) : value)
	@IsString()
	@Length(USER_RULES.USERNAME.MIN, USER_RULES.USERNAME.MAX)
	@Matches(USER_RULES.USERNAME.REGEX, {
		message: "Invalid username format (3-15 characters, letters, numbers, dots, no consecutive dots)"
	})
	username: string;

	@ApiProperty({
		nullable: true,
	})
	@Expose()
	@Type(() => Date)
	usernameUpdatedAt?: Date | null;

	@ApiProperty({ example: 'loup@recomend.com' })
	@Expose()
	email: string;

	@ApiProperty()
	@Expose()
	emailVerified: boolean;

	@ApiProperty({
		example: "Just a movie lover.",
		description: 'The bio of the user',
		nullable: true,
		maxLength: USER_RULES.BIO.MAX,
	})
	@Expose()
	@IsString()
	@Length(0, USER_RULES.BIO.MAX)
	@Matches(USER_RULES.BIO.REGEX, {
		message: "The bio cannot be empty or contain too many line breaks"
	})
	bio: string | null;

	@ApiProperty({ example: "https://example.com/avatar.jpg", description: 'The URL of the user avatar', nullable: true })
	@Expose()
	@IsUrl()
	avatar: string | null;

	@ApiProperty({ example: "https://example.com/background.jpg", description: 'The URL of the user background image', nullable: true })
	@Expose()
	@IsUrl()
	backgroundImage: string | null;

	@ApiProperty({ example: 'fr-FR' })
	@Expose()
	@IsLocale()
	language: string;

	@ApiProperty({ description: 'Whether the user has a premium account' })
	@Expose()
	isPremium: boolean;

	@ApiProperty({ description: 'Whether the user profile is private' })
	@Expose()
	isPrivate: boolean;

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
	@ApiProperty({ description: 'The number of followers the user has' })
	@Expose()
	followersCount: number;
	
	@ApiProperty({ description: 'The number of users this user is following' })
	@Expose()
	followingCount: number;
}

@ApiSchema({ name: 'UserSummary' })
export class UserSummaryDto extends PickType(UserDto, [
  'id', 
  'name', 
  'username', 
  'avatar', 
  'isPremium'
] as const) {}

@ApiSchema({ name: 'Profile' })
export class ProfileDto extends PickType(UserDto, ['id', 'name', 'username', 'avatar', 'bio', 'backgroundImage', 'isPrivate', 'isPremium', 'createdAt', 'followersCount', 'followingCount'] as const) {
	@ApiProperty({ description: 'Whether the user profile is visilble by current user (if target user is private)' })
	@Expose()
	isVisible: boolean;
}

@ApiSchema({ name: 'UpdateUser' })
export class UpdateUserDto extends PartialType(PickType(UserDto, ['name', 'username', 'bio', 'isPrivate', 'language'] as const)) {}

@ApiSchema({ name: 'BaseListUsersQuery' })
class BaseListUsersQueryDto {
	@ApiPropertyOptional({
		description: 'Field to sort followers by',
		default: UserSortBy.CREATED_AT,
		example: UserSortBy.CREATED_AT,
		enum: UserSortBy,
	})
	@IsOptional()
	@IsEnum(UserSortBy)
	sort_by: UserSortBy = UserSortBy.CREATED_AT;

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

@ApiSchema({ name: 'ListUsersQuery' })
export class ListUsersQueryDto extends IntersectionType(
  BaseListUsersQueryDto,
  PaginationQueryDto
) {}

@ApiSchema({ name: 'ListInfiniteUsersQuery' })
export class ListInfiniteUsersQueryDto extends IntersectionType(
  BaseListUsersQueryDto,
  CursorPaginationQueryDto
) {}

@ApiSchema({ name: 'ListUsers' })
export class ListUsersDto extends PaginatedResponseDto<UserSummaryDto> {
	@ApiProperty({ type: () => [UserSummaryDto] })
	@Type(() => UserSummaryDto)
	data: UserSummaryDto[];

	constructor(partial: Partial<ListUsersDto>) {
		super(partial);
		Object.assign(this, partial);
	}
}

@ApiSchema({ name: 'ListInfiniteUsers'})
export class ListInfiniteUsersDto extends CursorPaginatedResponseDto<UserSummaryDto> {
  @ApiProperty({ type: () => [UserSummaryDto] })
  @Type(() => UserSummaryDto)
  data: UserSummaryDto[];

  constructor(partial: Partial<ListInfiniteUsersDto>) {
	super(partial);
	Object.assign(this, partial);
  }
}

