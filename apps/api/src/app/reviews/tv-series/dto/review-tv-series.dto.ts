import { ApiProperty, ApiPropertyOptional, ApiSchema, IntersectionType, PickType } from "@nestjs/swagger";
import { IsNullable } from "../../../../common/decorators/is-nullable.decorator";
import { REVIEW_RULES } from "../../../../config/validation-rules";
import { Expose, Type } from "class-transformer";
import { IsBoolean, IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Length, Matches, ValidateNested } from "class-validator";
import { PaginatedResponseDto, PaginationQueryDto } from "../../../../common/dto/pagination.dto";
import { SortOrder } from "../../../../common/dto/sort.dto";
import { UserSummaryDto } from "../../../users/dto/users.dto";
import { CursorPaginatedResponseDto, CursorPaginationQueryDto } from "../../../../common/dto/cursor-pagination.dto";
import { TvSeriesCompactDto } from "../../../tv-series/dto/tv-series.dto";

export enum ReviewTvSeriesSortBy {
	CREATED_AT = 'created_at',
	UPDATED_AT = 'updated_at',
	LIKES_COUNT = 'likes_count',
	RATING = 'rating',
	RANDOM = 'random',
}

@ApiSchema({ name: 'ReviewTvSeries' })
export class ReviewTvSeriesDto {
	@ApiProperty({ example: 42 })
	@Expose()
	@IsInt()
	id: number;

	@ApiProperty({ example: 550 })
	@Expose()
	@IsInt()
	tvSeriesId: number;

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
        example: '<html><p>Best tv series ever!</p></html>',
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
	@IsDateString()
	createdAt: string;

	@ApiProperty()
	@Expose()
	@IsDateString()
	updatedAt: string;

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

@ApiSchema({ name: 'ReviewTvSeriesWithAuthor' })
export class ReviewTvSeriesWithAuthorDto extends ReviewTvSeriesDto {
	@ApiProperty({ example: 8.5, description: 'The rating given to the tv series', nullable: true })
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

@ApiSchema({ name: 'ReviewTvSeriesWithAuthorTvSeries' })
export class ReviewTvSeriesWithAuthorTvSeriesDto extends ReviewTvSeriesWithAuthorDto {
	@ApiProperty({ type: () => TvSeriesCompactDto, description: 'The tv series being reviewed' })
	@Expose()
	@ValidateNested()
	@Type(() => TvSeriesCompactDto)
	tvSeries: TvSeriesCompactDto;
}

@ApiSchema({ name: 'ReviewTvSeriesInput' })
export class ReviewTvSeriesInputDto extends PickType(ReviewTvSeriesDto, [
	'title',
	'body',
	'isSpoiler',
] as const) {}

@ApiSchema({ name: 'ListPaginatedReviewsTvSeries' })
export class ListPaginatedReviewsTvSeriesDto extends PaginatedResponseDto<ReviewTvSeriesWithAuthorDto> {
	@ApiProperty({ type: () => [ReviewTvSeriesWithAuthorDto] })
	@Type(() => ReviewTvSeriesWithAuthorDto)
	data: ReviewTvSeriesWithAuthorDto[];

	constructor(partial: Partial<ListPaginatedReviewsTvSeriesDto>) {
		super(partial);
		Object.assign(this, partial);
	}
}

@ApiSchema({ name: 'ListInfiniteReviewsTvSeries'})
export class ListInfiniteReviewsTvSeriesDto extends CursorPaginatedResponseDto<ReviewTvSeriesWithAuthorDto> {
  @ApiProperty({ type: () => [ReviewTvSeriesWithAuthorDto] })
  @Type(() => ReviewTvSeriesWithAuthorDto)
  data: ReviewTvSeriesWithAuthorDto[];

  constructor(partial: Partial<ListInfiniteReviewsTvSeriesDto>) {
	super(partial);
	Object.assign(this, partial);
  }
}

@ApiSchema({ name: 'BaseListReviewsTvSeriesQuery' })
class BaseListReviewsTvSeriesQueryDto {
	@ApiPropertyOptional({
		description: 'Field to sort reviews by',
		default: ReviewTvSeriesSortBy.CREATED_AT,
		example: ReviewTvSeriesSortBy.CREATED_AT,
		enum: ReviewTvSeriesSortBy,
	})
	@IsOptional()
	@IsEnum(ReviewTvSeriesSortBy)
	sort_by: ReviewTvSeriesSortBy = ReviewTvSeriesSortBy.CREATED_AT;

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

@ApiSchema({ name: 'ListPaginatedReviewsTvSeriesQuery' })
export class ListPaginatedReviewsTvSeriesQueryDto extends IntersectionType(
  BaseListReviewsTvSeriesQueryDto,
  PaginationQueryDto
) {}

@ApiSchema({ name: 'ListInfiniteReviewsTvSeriesQuery' })
export class ListInfiniteReviewsTvSeriesQueryDto extends IntersectionType(
  BaseListReviewsTvSeriesQueryDto,
  CursorPaginationQueryDto
) {}