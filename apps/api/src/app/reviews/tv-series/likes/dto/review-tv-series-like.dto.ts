import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsDateString } from 'class-validator';
import { PaginatedResponseDto } from '../../../../../common/dto/pagination.dto';
import { CursorPaginatedResponseDto } from '../../../../../common/dto/cursor-pagination.dto';
import { UserSummaryDto } from '../../../../users/dto/users.dto';

@ApiSchema({ name: 'ReviewTvSeriesLike' })
export class ReviewTvSeriesLikeDto {
  @ApiProperty({ example: '52', description: 'The ID of the review' })
  @Expose()
  reviewId!: number;

  @ApiProperty({ example: 'user-uuid-123', description: 'The ID of the user who liked the review' })
  @Expose()
  userId!: string;

  // Dates
  @ApiProperty()
  @Expose()
  @IsDateString()
  createdAt!: string;
}

@ApiSchema({ name: 'ListPaginatedReviewTvSeriesLikes' })
export class ListPaginatedReviewTvSeriesLikesDto extends PaginatedResponseDto<UserSummaryDto> {
  @ApiProperty({ type: () => [UserSummaryDto] })
  @Type(() => UserSummaryDto)
  data!: UserSummaryDto[];

  constructor(partial: Partial<ListPaginatedReviewTvSeriesLikesDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}

@ApiSchema({ name: 'ListInfiniteReviewTvSeriesLikes' })
export class ListInfiniteReviewTvSeriesLikesDto extends CursorPaginatedResponseDto<UserSummaryDto> {
  @ApiProperty({ type: () => [UserSummaryDto] })
  @Type(() => UserSummaryDto)
  data!: UserSummaryDto[];

  constructor(partial: Partial<ListInfiniteReviewTvSeriesLikesDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}
