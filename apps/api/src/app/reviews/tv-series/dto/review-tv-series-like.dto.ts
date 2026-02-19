import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";

@ApiSchema({ name: 'ReviewTvSeriesLike' })
export class ReviewTvSeriesLikeDto {
	@ApiProperty({ example: "52", description: 'The ID of the review' })
	@Expose()
	reviewId: number;
	
	@ApiProperty({ example: "user-uuid-123", description: 'The ID of the user who liked the review' })
	@Expose()
	userId: string;

	// Dates
	@ApiProperty()
	@Expose()
	@Type(() => Date)
	createdAt: Date;
}