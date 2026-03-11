import { ApiProperty, ApiPropertyOptional, ApiSchema, IntersectionType } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { SortOrder } from '../../../../common/dto/sort.dto';
import { PaginatedResponseDto, PaginationQueryDto } from '../../../../common/dto/pagination.dto';
import { CursorPaginatedResponseDto, CursorPaginationQueryDto } from '../../../../common/dto/cursor-pagination.dto';
import { PlaylistDto, PlaylistSortBy } from '../../dto/playlists.dto';

@ApiSchema({ name: 'PlaylistsAddTarget' })
export class PlaylistsAddTargetDto extends PlaylistDto {
  @ApiProperty({ description: 'True if the media is already in this playlist' })
  @Expose()
  alreadyAdded: boolean;
}

export class BaseListPlaylistsAddTargetsQueryDto {
  @ApiPropertyOptional({
    description: 'Field to sort playlists by',
    default: PlaylistSortBy.UPDATED_AT,
    example: PlaylistSortBy.UPDATED_AT,
    enum: PlaylistSortBy,
  })
  @IsOptional()
  @IsEnum(PlaylistSortBy)
  sort_by: PlaylistSortBy = PlaylistSortBy.UPDATED_AT;

  @ApiPropertyOptional({
    description: 'Sort order',
    default: SortOrder.DESC,
    example: SortOrder.DESC,
    enum: SortOrder,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sort_order: SortOrder = SortOrder.DESC;

  @ApiPropertyOptional({ description: 'Search playlists by title' })
  @IsOptional()
  @IsString()
  search?: string;
}

@ApiSchema({ name: 'ListAllPlaylistsAddTargetsQuery' })
export class ListAllPlaylistsAddTargetsQueryDto extends BaseListPlaylistsAddTargetsQueryDto {}

@ApiSchema({ name: 'ListPaginatedPlaylistsAddTargetsQuery' })
export class ListPaginatedPlaylistsAddTargetsQueryDto extends IntersectionType(
  BaseListPlaylistsAddTargetsQueryDto,
  PaginationQueryDto
) {}

@ApiSchema({ name: 'ListInfinitePlaylistsAddTargetsQuery' })
export class ListInfinitePlaylistsAddTargetsQueryDto extends IntersectionType(
  BaseListPlaylistsAddTargetsQueryDto,
  CursorPaginationQueryDto
) {}

@ApiSchema({ name: 'ListPaginatedPlaylistsAddTargets' })
export class ListPaginatedPlaylistsAddTargetsDto extends PaginatedResponseDto<PlaylistsAddTargetDto> {
  @ApiProperty({ type: () => [PlaylistsAddTargetDto] })
  @Type(() => PlaylistsAddTargetDto)
  data: PlaylistsAddTargetDto[];

  constructor(partial: Partial<ListPaginatedPlaylistsAddTargetsDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}

@ApiSchema({ name: 'ListInfinitePlaylistsAddTargets' })
export class ListInfinitePlaylistsAddTargetsDto extends CursorPaginatedResponseDto<PlaylistsAddTargetDto> {
  @ApiProperty({ type: () => [PlaylistsAddTargetDto] })
  @Type(() => PlaylistsAddTargetDto)
  data: PlaylistsAddTargetDto[];

  constructor(partial: Partial<ListInfinitePlaylistsAddTargetsDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}