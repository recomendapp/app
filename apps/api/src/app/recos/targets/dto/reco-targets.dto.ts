import { ApiProperty, ApiPropertyOptional, ApiSchema, IntersectionType } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { PaginatedResponseDto, PaginationQueryDto } from '../../../../common/dto/pagination.dto';
import { CursorPaginatedResponseDto, CursorPaginationQueryDto } from '../../../../common/dto/cursor-pagination.dto';
import { UserSummaryDto } from '../../../users/dto/users.dto';
import { SortOrder } from '../../../../common/dto/sort.dto';

export enum RecoTargetSortBy {
  RECENTLY_SENT = 'recently_sent',
}

@ApiSchema({ name: 'RecoTarget' })
export class RecoTargetDto extends UserSummaryDto {
  @ApiProperty({ description: 'True if the user has already seen this media' })
  @Expose()
  alreadySeen!: boolean;

  @ApiProperty({ description: 'True if you have already sent an active reco to this user for this media' })
  @Expose()
  alreadySent!: boolean;
}

export class BaseListRecoTargetsQueryDto {
  @ApiPropertyOptional({
    description: 'Field to sort reco targets by',
    default: RecoTargetSortBy.RECENTLY_SENT,
    example: RecoTargetSortBy.RECENTLY_SENT,
    enum: RecoTargetSortBy,
  })
  @IsOptional()
  @IsEnum(RecoTargetSortBy)
  sort_by: RecoTargetSortBy = RecoTargetSortBy.RECENTLY_SENT;

  @ApiPropertyOptional({
    description: 'Sort order',
    default: SortOrder.DESC,
    example: SortOrder.DESC,
    enum: SortOrder,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sort_order: SortOrder = SortOrder.DESC;

  @ApiPropertyOptional({ description: 'Search friends by username' })
  @IsOptional()
  @IsString()
  search?: string;
}

@ApiSchema({ name: 'ListAllRecoTargetsQuery' })
export class ListAllRecoTargetsQueryDto extends BaseListRecoTargetsQueryDto {}

@ApiSchema({ name: 'ListPaginatedRecoTargetsQuery' })
export class ListPaginatedRecoTargetsQueryDto extends IntersectionType(
  BaseListRecoTargetsQueryDto,
  PaginationQueryDto
) {}

@ApiSchema({ name: 'ListInfiniteRecoTargetsQuery' })
export class ListInfiniteRecoTargetsQueryDto extends IntersectionType(
  BaseListRecoTargetsQueryDto,
  CursorPaginationQueryDto
) {}

@ApiSchema({ name: 'ListPaginatedRecoTargets' })
export class ListPaginatedRecoTargetsDto extends PaginatedResponseDto<RecoTargetDto> {
  @ApiProperty({ type: () => [RecoTargetDto] })
  @Type(() => RecoTargetDto)
  data!: RecoTargetDto[];

  constructor(partial: Partial<ListPaginatedRecoTargetsDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}

@ApiSchema({ name: 'ListInfiniteRecoTargets' })
export class ListInfiniteRecoTargetsDto extends CursorPaginatedResponseDto<RecoTargetDto> {
  @ApiProperty({ type: () => [RecoTargetDto] })
  @Type(() => RecoTargetDto)
  data!: RecoTargetDto[];

  constructor(partial: Partial<ListInfiniteRecoTargetsDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}