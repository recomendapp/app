import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsDateString, ValidateNested } from 'class-validator';
import { PaginatedResponseDto } from '../../../../../../common/dto/pagination.dto';
import { CursorPaginatedResponseDto } from '../../../../../../common/dto/cursor-pagination.dto';
import { UserSummaryDto } from '../../../../../users/dto/users.dto';

@ApiSchema({ name: 'ReviewMovieCommentLike' })
export class ReviewMovieCommentLikeDto {
  @ApiProperty({ example: '52', description: 'The ID of the comment' })
  @Expose()
  commentId!: number;

  @ApiProperty({
    example: 'user-uuid-123',
    description: 'The ID of the user who liked the comment',
  })
  @Expose()
  userId!: string;

  // Dates
  @ApiProperty()
  @Expose()
  @IsDateString()
  createdAt!: string;
}

@ApiSchema({ name: 'ListPaginatedReviewMovieCommentLikes' })
export class ListPaginatedReviewMovieCommentLikesDto extends PaginatedResponseDto<UserSummaryDto> {
  @ApiProperty({ type: () => [UserSummaryDto] })
  @Type(() => UserSummaryDto)
  @ValidateNested({ each: true })
  @Expose()
  data!: UserSummaryDto[];

  constructor(partial: Partial<ListPaginatedReviewMovieCommentLikesDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}

@ApiSchema({ name: 'ListInfiniteReviewMovieCommentLikes' })
export class ListInfiniteReviewMovieCommentLikesDto extends CursorPaginatedResponseDto<UserSummaryDto> {
  @ApiProperty({ type: () => [UserSummaryDto] })
  @Type(() => UserSummaryDto)
  @ValidateNested({ each: true })
  @Expose()
  data!: UserSummaryDto[];

  constructor(partial: Partial<ListInfiniteReviewMovieCommentLikesDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}
