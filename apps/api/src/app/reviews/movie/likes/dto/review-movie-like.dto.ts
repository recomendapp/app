import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsDateString, ValidateNested } from 'class-validator';
import { PaginatedResponseDto } from '../../../../../common/dto/pagination.dto';
import { CursorPaginatedResponseDto } from '../../../../../common/dto/cursor-pagination.dto';
import { UserSummaryDto } from '../../../../users/dto/users.dto';

@ApiSchema({ name: 'ReviewMovieLike' })
export class ReviewMovieLikeDto {
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

@ApiSchema({ name: 'ListPaginatedReviewMovieLikes' })
export class ListPaginatedReviewMovieLikesDto extends PaginatedResponseDto<UserSummaryDto> {
  @ApiProperty({ type: () => [UserSummaryDto] })
  @Type(() => UserSummaryDto)
  @ValidateNested({ each: true })
  @Expose()
  data!: UserSummaryDto[];

  constructor(partial: Partial<ListPaginatedReviewMovieLikesDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}

@ApiSchema({ name: 'ListInfiniteReviewMovieLikes' })
export class ListInfiniteReviewMovieLikesDto extends CursorPaginatedResponseDto<UserSummaryDto> {
  @ApiProperty({ type: () => [UserSummaryDto] })
  @Type(() => UserSummaryDto)
  @ValidateNested({ each: true })
  @Expose()
  data!: UserSummaryDto[];

  constructor(partial: Partial<ListInfiniteReviewMovieLikesDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}
