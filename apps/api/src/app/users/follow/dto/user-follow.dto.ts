import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { IsIn, IsString } from "class-validator";
import { followStatusEnum } from "@libs/db/schemas";

@ApiSchema({ name: 'Follow' })
export class FollowDto {
	@ApiProperty({ example: "ciud123", description: 'The unique ID of the follower' })
	@Expose()
	followerId: string;

	@ApiProperty({ example: "ciud456", description: 'The unique ID of the following' })
	@Expose()
	followingId: string;

	@ApiProperty({
		description: 'The status of the follow relationship',
		enum: followStatusEnum.enumValues, 
		example: followStatusEnum.enumValues[0],
	})
	@Expose()
	@IsString()
	@IsIn(followStatusEnum.enumValues, {
		message: `Status must be one of: ${followStatusEnum.enumValues.join(', ')}`
	})
	status: typeof followStatusEnum.enumValues[number];

	// Dates
	@ApiProperty()
    @Expose()
    @Type(() => Date)
    createdAt: Date;
}

