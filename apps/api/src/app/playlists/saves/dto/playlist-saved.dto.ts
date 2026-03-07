import { ApiProperty, ApiPropertyOptional, ApiSchema, IntersectionType } from "@nestjs/swagger";
import { CursorPaginationQueryDto } from "../../../../common/dto/cursor-pagination.dto";
import { PaginationQueryDto } from "../../../../common/dto/pagination.dto";
import { SortOrder } from "../../../../common/dto/sort.dto";
import { Expose, Type } from "class-transformer";
import { IsEnum, IsOptional } from "class-validator";

export enum PlaylistSavedSortBy {
  SAVED_AT = 'saved_at',
  UPDATED_AT = 'updated_at',
  LIKES_COUNT = 'likes_count',
  RANDOM = 'random',
}

@ApiSchema({ name: 'PlaylistSaved' })
export class PlaylistSavedDto {
	@ApiProperty({ example: "52", description: 'The ID of the playlist' })
	@Expose()
	playlistId: number;
	
	@ApiProperty({ example: "user-uuid-123", description: 'The ID of the user who saved the playlist' })
	@Expose()
	userId: string;

	// Dates
	@ApiProperty()
	@Expose()
	@Type(() => Date)
	createdAt: Date;
}

@ApiSchema({ name: 'BaseListPlaylistsSavedQuery' })
export class BaseListPlaylistsSavedQueryDto {
    @ApiPropertyOptional({
        description: 'Field to sort saved playlists by',
        default: PlaylistSavedSortBy.SAVED_AT,
        example: PlaylistSavedSortBy.SAVED_AT,
        enum: PlaylistSavedSortBy,
    })
    @IsOptional()
    @IsEnum(PlaylistSavedSortBy)
    sort_by: PlaylistSavedSortBy = PlaylistSavedSortBy.SAVED_AT;

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

@ApiSchema({ name: 'ListPaginatedPlaylistsSavedQuery' })
export class ListPaginatedPlaylistsSavedQueryDto extends IntersectionType(
  BaseListPlaylistsSavedQueryDto,
  PaginationQueryDto
) {}

@ApiSchema({ name: 'ListInfinitePlaylistsSavedQuery' })
export class ListInfinitePlaylistsSavedQueryDto extends IntersectionType(
  BaseListPlaylistsSavedQueryDto,
  CursorPaginationQueryDto
) {}