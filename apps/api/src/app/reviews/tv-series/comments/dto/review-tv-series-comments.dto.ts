import {
  ApiProperty,
  ApiPropertyOptional,
  ApiSchema,
  IntersectionType,
  PickType,
} from '@nestjs/swagger';
import { IsNullable } from '../../../../../common/decorators/is-nullable.decorator';
import { REVIEW_COMMENT_RULES } from '@libs/rules';
import { Expose, Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { PaginatedResponseDto, PaginationQueryDto } from '../../../../../common/dto/pagination.dto';
import { SortOrder } from '../../../../../common/dto/sort.dto';
import { UserSummaryDto } from '../../../../users/dto/users.dto';
import {
  CursorPaginatedResponseDto,
  CursorPaginationQueryDto,
} from '../../../../../common/dto/cursor-pagination.dto';

export enum ReviewTvSeriesCommentSortBy {
  CREATED_AT = 'created_at',
  LIKES_COUNT = 'likes_count',
}

@ApiSchema({ name: 'ReviewTvSeriesComment' })
export class ReviewTvSeriesCommentDto {
  @ApiProperty({ example: 42 })
  @Expose()
  @IsInt()
  id!: number;

  @ApiProperty({ example: 52 })
  @Expose()
  @IsInt()
  reviewId!: number;

  @ApiProperty({ example: 'user-uuid-123' })
  @Expose()
  userId!: string;

  @ApiProperty({
    description: 'The ID of the top-level comment this is a reply to, null if top-level',
    example: null,
    nullable: true,
  })
  @Expose()
  @IsNullable()
  @IsInt()
  parentId!: number | null;

  @ApiProperty({
    description: 'The content of the comment, null if the comment has been deleted',
    example: 'Totally agree with this review!',
    nullable: true,
    maxLength: REVIEW_COMMENT_RULES.BODY.MAX,
  })
  @Expose()
  @IsNullable()
  @IsString()
  body!: string | null;

  @ApiProperty({
    description: 'When the comment was soft-deleted, null if not deleted',
    nullable: true,
  })
  @Expose()
  @IsNullable()
  @IsDateString()
  deletedAt!: string | null;

  // Dates
  @ApiProperty()
  @Expose()
  @IsDateString()
  createdAt!: string;

  @ApiProperty()
  @Expose()
  @IsDateString()
  updatedAt!: string;

  // Counts
  @ApiProperty({ description: 'The number of likes' })
  @Expose()
  @IsInt()
  likesCount!: number;

  @ApiProperty({ description: 'The number of replies (only relevant for top-level comments)' })
  @Expose()
  @IsInt()
  repliesCount!: number;
}

@ApiSchema({ name: 'ReviewTvSeriesCommentWithAuthor' })
export class ReviewTvSeriesCommentWithAuthorDto extends ReviewTvSeriesCommentDto {
  @ApiProperty({ type: () => UserSummaryDto, description: 'The author of the comment' })
  @Expose()
  @ValidateNested()
  @Type(() => UserSummaryDto)
  author!: UserSummaryDto;
}

@ApiSchema({ name: 'ReviewTvSeriesCommentInput' })
export class ReviewTvSeriesCommentInputDto {
  @ApiProperty({
    description: 'The content of the comment',
    example: 'Totally agree with this review!',
    minLength: REVIEW_COMMENT_RULES.BODY.MIN,
    maxLength: REVIEW_COMMENT_RULES.BODY.MAX,
  })
  @Expose()
  @IsString()
  @Length(REVIEW_COMMENT_RULES.BODY.MIN, REVIEW_COMMENT_RULES.BODY.MAX)
  body!: string;

  @ApiPropertyOptional({
    description: 'The ID of the top-level comment being replied to. Omit for a top-level comment.',
    example: 42,
  })
  @Expose()
  @IsOptional()
  @IsInt()
  parentId?: number;
}

@ApiSchema({ name: 'ReviewTvSeriesCommentUpdateInput' })
export class ReviewTvSeriesCommentUpdateInputDto extends PickType(ReviewTvSeriesCommentInputDto, [
  'body',
] as const) {}

@ApiSchema({ name: 'ListPaginatedReviewTvSeriesComments' })
export class ListPaginatedReviewTvSeriesCommentsDto extends PaginatedResponseDto<ReviewTvSeriesCommentWithAuthorDto> {
  @ApiProperty({ type: () => [ReviewTvSeriesCommentWithAuthorDto] })
  @Type(() => ReviewTvSeriesCommentWithAuthorDto)
  data!: ReviewTvSeriesCommentWithAuthorDto[];

  constructor(partial: Partial<ListPaginatedReviewTvSeriesCommentsDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}

@ApiSchema({ name: 'ListInfiniteReviewTvSeriesComments' })
export class ListInfiniteReviewTvSeriesCommentsDto extends CursorPaginatedResponseDto<ReviewTvSeriesCommentWithAuthorDto> {
  @ApiProperty({ type: () => [ReviewTvSeriesCommentWithAuthorDto] })
  @Type(() => ReviewTvSeriesCommentWithAuthorDto)
  data!: ReviewTvSeriesCommentWithAuthorDto[];

  constructor(partial: Partial<ListInfiniteReviewTvSeriesCommentsDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}

@ApiSchema({ name: 'BaseListReviewTvSeriesCommentsQuery' })
class BaseListReviewTvSeriesCommentsQueryDto {
  @ApiPropertyOptional({
    description: 'Field to sort comments by',
    default: ReviewTvSeriesCommentSortBy.CREATED_AT,
    example: ReviewTvSeriesCommentSortBy.CREATED_AT,
    enum: ReviewTvSeriesCommentSortBy,
  })
  @IsOptional()
  @IsEnum(ReviewTvSeriesCommentSortBy)
  sort_by: ReviewTvSeriesCommentSortBy = ReviewTvSeriesCommentSortBy.CREATED_AT;

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

@ApiSchema({ name: 'ListPaginatedReviewTvSeriesCommentsQuery' })
export class ListPaginatedReviewTvSeriesCommentsQueryDto extends IntersectionType(
  BaseListReviewTvSeriesCommentsQueryDto,
  PaginationQueryDto,
) {}

@ApiSchema({ name: 'ListInfiniteReviewTvSeriesCommentsQuery' })
export class ListInfiniteReviewTvSeriesCommentsQueryDto extends IntersectionType(
  BaseListReviewTvSeriesCommentsQueryDto,
  CursorPaginationQueryDto,
) {}
