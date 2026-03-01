import { ApiProperty, ApiPropertyOptional, ApiSchema, IntersectionType, PickType } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { IsEnum, IsOptional, ValidateNested } from "class-validator";
import { FollowDto } from "../../follow/dto/user-follow.dto";
import { UserSummaryDto } from "../../dto/users.dto";
import { SortOrder } from "../../../../common/dto/sort.dto";
import { PaginatedResponseDto, PaginationQueryDto } from "../../../../common/dto/pagination.dto";
import { CursorPaginatedResponseDto, CursorPaginationQueryDto } from "../../../../common/dto/cursor-pagination.dto";


export enum FollowRequestSortBy {
  CREATED_AT = 'created_at',
  FOLLOWERs_COUNT = 'followers_count',
}

@ApiSchema({ name: 'FollowRequest' })
export class FollowRequestDto extends PickType(FollowDto, ['createdAt'] as const) {
	@ApiProperty({ type: () => UserSummaryDto, description: 'The user object' })
	@Expose()
	@ValidateNested()
	@Type(() => UserSummaryDto)
	user: UserSummaryDto;
}

export class BaseListFollowRequestsQueryDto {
  @ApiPropertyOptional({
	description: 'Field to sort follow requests by',
	default: FollowRequestSortBy.CREATED_AT,
	example: FollowRequestSortBy.CREATED_AT,
	enum: FollowRequestSortBy,
  })
  @IsOptional()
  @IsEnum(FollowRequestSortBy)
  sort_by: FollowRequestSortBy = FollowRequestSortBy.CREATED_AT;

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

@ApiSchema({ name: 'ListPaginatedFollowRequestsQuery' })
export class ListPaginatedFollowRequestsQueryDto extends IntersectionType(
  BaseListFollowRequestsQueryDto,
  PaginationQueryDto
) {}

@ApiSchema({ name: 'ListInfiniteFollowRequestsQuery' })
export class ListInfiniteFollowRequestsQueryDto extends IntersectionType(
  BaseListFollowRequestsQueryDto,
  CursorPaginationQueryDto
) {}

@ApiSchema({ name: 'ListPaginatedFollowRequests' })
export class ListPaginatedFollowRequestsDto extends PaginatedResponseDto<FollowRequestDto> {
	@ApiProperty({ type: () => [FollowRequestDto] })
	@Type(() => FollowRequestDto)
	data: FollowRequestDto[];

	constructor(partial: Partial<ListPaginatedFollowRequestsDto>) {
		super(partial);
		Object.assign(this, partial);
	}
}

@ApiSchema({ name: 'ListInfiniteFollowRequests' })
export class ListInfiniteFollowRequestsDto extends CursorPaginatedResponseDto<FollowRequestDto> {
  @ApiProperty({ type: () => [FollowRequestDto] })
  @Type(() => FollowRequestDto)
  data: FollowRequestDto[];

  constructor(partial: Partial<ListInfiniteFollowRequestsDto>) {
	super(partial);
	Object.assign(this, partial);
  }
}


