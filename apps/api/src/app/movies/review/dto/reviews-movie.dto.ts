import { ApiProperty, ApiSchema, PickType } from "@nestjs/swagger";
import { IsNullable } from "../../../../common/decorators/is-nullable.decorator";
import { REVIEW_RULES } from "../../../../config/validation-rules";
import { Expose, Type } from "class-transformer";
import { IsBoolean, IsInt, IsString, Length, Matches } from "class-validator";

@ApiSchema({ name: 'ReviewMovie' })
export class ReviewMovieDto {
	@ApiProperty({ example: 42 })
	@Expose()
	@IsInt()
	id: number;

	@ApiProperty({ 
        description: 'The title of the review', 
        example: 'A cinematic masterpiece',
        nullable: true,
        minLength: REVIEW_RULES.TITLE.MIN,
        maxLength: REVIEW_RULES.TITLE.MAX,
    })
    @Expose()
    @IsString()
	@IsNullable()
    @Length(REVIEW_RULES.TITLE.MIN, REVIEW_RULES.TITLE.MAX)
	@Matches(REVIEW_RULES.TITLE.REGEX, {
		message: 'Invalid title format'
	})
    title: string | null;

	@ApiProperty({ 
        description: 'The content of the review wrapped in <html> tags', 
        example: '<html><p>Best movie ever!</p></html>',
        maxLength: REVIEW_RULES.BODY.MAX,
    })
    @Expose()
    @IsString()
    @Length(REVIEW_RULES.BODY.MIN, REVIEW_RULES.BODY.MAX)
    @Matches(REVIEW_RULES.BODY.REGEX, {
        message: 'Body must be wrapped in <html> and </html> tags',
    })
    body: string;

	@ApiProperty({ description: 'Whether the review contain spoils' })
	@Expose()
	@IsBoolean()
	isSpoiler: boolean;

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
	@ApiProperty({ description: 'The number of likes' })
	@Expose()
	@IsInt()
	likesCount: number;
	
	@ApiProperty({ description: 'The number of views' })
	@Expose()
	@IsInt()
	viewsCount: number;

	@ApiProperty({ description: 'The number of comments' })
	@Expose()
	@IsInt()
	commentsCount: number;
}

@ApiSchema({ name: 'ReviewMovieInput' })
export class ReviewMovieInputDto extends PickType(ReviewMovieDto, [
	'title',
	'body',
	'isSpoiler',
] as const) {}