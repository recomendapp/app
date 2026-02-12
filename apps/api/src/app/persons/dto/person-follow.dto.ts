import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { IsInt } from "class-validator";

@ApiSchema({ name: 'PersonFollow' })
export class PersonFollowDto {
	@ApiProperty({ example: "ciud123", description: 'The unique ID of the user who is following' })
	@Expose()
	userId: string;

	@ApiProperty({
		description: "The person's unique identifier",
		example: 525,
		type: Number,
		nullable: false,
	})
	@Expose()
	@IsInt()
	personId: number;

	// Dates
	@ApiProperty()
    @Expose()
    @Type(() => Date)
    createdAt: Date;
}

