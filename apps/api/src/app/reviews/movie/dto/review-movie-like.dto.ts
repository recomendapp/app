import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { IsDateString } from "class-validator";

@ApiSchema({ name: 'ReviewMovieLike' })
export class ReviewMovieLikeDto {
	@ApiProperty({ example: "52", description: 'The ID of the review' })
	@Expose()
	reviewId: number;
	
	@ApiProperty({ example: "user-uuid-123", description: 'The ID of the user who liked the review' })
	@Expose()
	userId: string;

	// Dates
	@ApiProperty()
	@Expose()
	@IsDateString()
	createdAt: string;
}