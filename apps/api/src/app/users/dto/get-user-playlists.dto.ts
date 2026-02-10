import { ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { PlaylistSortBy } from '../../playlists/dto/playlists.dto';
import { SortOrder } from '../../../common/dto/sort.dto';

@ApiSchema({ name: 'GetUserPlaylistsQuery' })
export class GetUserPlaylistsQueryDto extends PaginationQueryDto {
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
}
