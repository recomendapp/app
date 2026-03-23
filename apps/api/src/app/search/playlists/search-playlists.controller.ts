import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SearchPlaylistsService } from './search-playlists.service';
import { OptionalAuthGuard } from '../../auth/guards';
import { CurrentOptionalUser } from '../../auth/decorators';
import { User } from '../../auth/auth.service';
import { ListPaginatedSearchPlaylistsQueryDto, ListInfiniteSearchPlaylistsQueryDto } from './search-playlists.dto';
import { ListInfinitePlaylistsWithOwnerDto, ListPaginatedPlaylistsWithOwnerDto } from '../../playlists/dto/playlists.dto';

@ApiTags('Search')
@Controller({
  path: 'search/playlists',
  version: '1',
})
export class SearchPlaylistsController {
  constructor(private readonly searchPlaylistsService: SearchPlaylistsService) {}

  @Get('paginated')
  @ApiOkResponse({
    description: 'Search playlists with pagination',
    type: ListPaginatedPlaylistsWithOwnerDto,
  })
  async listPaginated(
    @CurrentOptionalUser() currentUser: User | null,
    @Query() dto: ListPaginatedSearchPlaylistsQueryDto,
  ): Promise<ListPaginatedPlaylistsWithOwnerDto> {
    return this.searchPlaylistsService.listPaginated({
      currentUser,
      dto,
    });
  }

  @Get('infinite')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Search playlists with infinite scroll',
    type: ListInfinitePlaylistsWithOwnerDto,
  })
  async listInfinite(
    @CurrentOptionalUser() currentUser: User | null,
    @Query() dto: ListInfiniteSearchPlaylistsQueryDto,
  ): Promise<ListInfinitePlaylistsWithOwnerDto> {
    return this.searchPlaylistsService.listInfinite({
      currentUser,
      dto,
    });
  }
}
