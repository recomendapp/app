import { ApiProperty, ApiPropertyOptional, ApiSchema, IntersectionType, PickType } from "@nestjs/swagger";
import { IsNullable } from "../../../../common/decorators/is-nullable.decorator";
import { REVIEW_RULES } from "../../../../config/validation-rules";
import { Expose, Type } from "class-transformer";
import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, Length, Matches, ValidateNested } from "class-validator";
import { PaginatedResponseDto, PaginationQueryDto } from "../../../../common/dto/pagination.dto";
import { SortOrder } from "../../../../common/dto/sort.dto";
import { UserSummaryDto } from "../../../users/dto/users.dto";
import { CursorPaginatedResponseDto, CursorPaginationQueryDto } from "../../../../common/dto/cursor-pagination.dto";

export enum ReviewMovieSortBy {
	CREATED_AT = 'created_at',
	UPDATED_AT = 'updated_at',
	LIKES_COUNT = 'likes_count',
	RATING = 'rating',
	RANDOM = 'random',
}

@ApiSchema({ name: 'ReviewMovie' })
export class ReviewMovieDto {
	@ApiProperty({ example: 42 })
	@Expose()
	@IsInt()
	id: number;

	@ApiProperty({ example: 550 })
	@Expose()
	@IsInt()
	movieId: number;

	@ApiProperty({ example: 'user-uuid-123' })
	@Expose()
	userId: string;

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

@ApiSchema({ name: 'ReviewMovieWithAuthor' })
export class ReviewMovieWithAuthorDto extends ReviewMovieDto {
	@ApiProperty({ example: 8.5, description: 'The rating given to the movie', nullable: true })
	@Expose()
	@IsNumber()
	@IsNullable()
	rating: number | null;

	@ApiProperty({ type: () => UserSummaryDto, description: 'The author of the review' })
	@Expose()
	@ValidateNested()
	@Type(() => UserSummaryDto)
	author: UserSummaryDto;
}

@ApiSchema({ name: 'ReviewMovieInput' })
export class ReviewMovieInputDto extends PickType(ReviewMovieDto, [
	'title',
	'body',
	'isSpoiler',
] as const) {}

@ApiSchema({ name: 'ListReviewsMovie' })
export class ListReviewsMovieDto extends PaginatedResponseDto<ReviewMovieWithAuthorDto> {
	@ApiProperty({ type: () => [ReviewMovieWithAuthorDto] })
	@Type(() => ReviewMovieWithAuthorDto)
	data: ReviewMovieWithAuthorDto[];

	constructor(partial: Partial<ListReviewsMovieDto>) {
		super(partial);
		Object.assign(this, partial);
	}
}

@ApiSchema({ name: 'ListInfiniteReviewsMovie'})
export class ListInfiniteReviewsMovieDto extends CursorPaginatedResponseDto<ReviewMovieWithAuthorDto> {
  @ApiProperty({ type: () => [ReviewMovieWithAuthorDto] })
  @Type(() => ReviewMovieWithAuthorDto)
  data: ReviewMovieWithAuthorDto[];

  constructor(partial: Partial<ListInfiniteReviewsMovieDto>) {
	super(partial);
	Object.assign(this, partial);
  }
}

@ApiSchema({ name: 'BaseListReviewsMovieQuery' })
class BaseListReviewsMovieQueryDto {
	@ApiPropertyOptional({
		description: 'Field to sort reviews by',
		default: ReviewMovieSortBy.CREATED_AT,
		example: ReviewMovieSortBy.CREATED_AT,
		enum: ReviewMovieSortBy,
	})
	@IsOptional()
	@IsEnum(ReviewMovieSortBy)
	sort_by: ReviewMovieSortBy = ReviewMovieSortBy.CREATED_AT;

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

@ApiSchema({ name: 'ListReviewsMovieQuery' })
export class ListReviewsMovieQueryDto extends IntersectionType(
  BaseListReviewsMovieQueryDto,
  PaginationQueryDto
) {}

@ApiSchema({ name: 'ListInfiniteReviewsMovieQuery' })
export class ListInfiniteReviewsMovieQueryDto extends IntersectionType(
  BaseListReviewsMovieQueryDto,
  CursorPaginationQueryDto
) {}