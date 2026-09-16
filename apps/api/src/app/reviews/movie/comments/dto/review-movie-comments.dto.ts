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

export enum ReviewMovieCommentSortBy {
  CREATED_AT = 'created_at',
  LIKES_COUNT = 'likes_count',
}

@ApiSchema({ name: 'ReviewMovieComment' })
export class ReviewMovieCommentDto {
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

@ApiSchema({ name: 'ReviewMovieCommentWithAuthor' })
export class ReviewMovieCommentWithAuthorDto extends ReviewMovieCommentDto {
  @ApiProperty({ type: () => UserSummaryDto, description: 'The author of the comment' })
  @Expose()
  @ValidateNested()
  @Type(() => UserSummaryDto)
  author!: UserSummaryDto;
}

@ApiSchema({ name: 'ReviewMovieCommentInput' })
export class ReviewMovieCommentInputDto {
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

@ApiSchema({ name: 'ReviewMovieCommentUpdateInput' })
export class ReviewMovieCommentUpdateInputDto extends PickType(ReviewMovieCommentInputDto, [
  'body',
] as const) {}

@ApiSchema({ name: 'ListPaginatedReviewMovieComments' })
export class ListPaginatedReviewMovieCommentsDto extends PaginatedResponseDto<ReviewMovieCommentWithAuthorDto> {
  @ApiProperty({ type: () => [ReviewMovieCommentWithAuthorDto] })
  @Type(() => ReviewMovieCommentWithAuthorDto)
  data!: ReviewMovieCommentWithAuthorDto[];

  constructor(partial: Partial<ListPaginatedReviewMovieCommentsDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}

@ApiSchema({ name: 'ListInfiniteReviewMovieComments' })
export class ListInfiniteReviewMovieCommentsDto extends CursorPaginatedResponseDto<ReviewMovieCommentWithAuthorDto> {
  @ApiProperty({ type: () => [ReviewMovieCommentWithAuthorDto] })
  @Type(() => ReviewMovieCommentWithAuthorDto)
  data!: ReviewMovieCommentWithAuthorDto[];

  constructor(partial: Partial<ListInfiniteReviewMovieCommentsDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}

@ApiSchema({ name: 'BaseListReviewMovieCommentsQuery' })
class BaseListReviewMovieCommentsQueryDto {
  @ApiPropertyOptional({
    description: 'Field to sort comments by',
    default: ReviewMovieCommentSortBy.CREATED_AT,
    example: ReviewMovieCommentSortBy.CREATED_AT,
    enum: ReviewMovieCommentSortBy,
  })
  @IsOptional()
  @IsEnum(ReviewMovieCommentSortBy)
  sort_by: ReviewMovieCommentSortBy = ReviewMovieCommentSortBy.CREATED_AT;

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

@ApiSchema({ name: 'ListPaginatedReviewMovieCommentsQuery' })
export class ListPaginatedReviewMovieCommentsQueryDto extends IntersectionType(
  BaseListReviewMovieCommentsQueryDto,
  PaginationQueryDto,
) {}

@ApiSchema({ name: 'ListInfiniteReviewMovieCommentsQuery' })
export class ListInfiniteReviewMovieCommentsQueryDto extends IntersectionType(
  BaseListReviewMovieCommentsQueryDto,
  CursorPaginationQueryDto,
) {}
