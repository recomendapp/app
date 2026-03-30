import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PlaylistFeaturedService } from './playlist-featured.service';
import { OptionalAuthGuard } from '../../auth/guards';
import { CurrentOptionalUser } from '../../auth/decorators';
import { User } from '../../auth/auth.service';
import { 
  ListInfinitePlaylistsQueryDto, 
  ListInfinitePlaylistsWithOwnerDto, 
  ListPaginatedPlaylistsQueryDto, 
  ListPaginatedPlaylistsWithOwnerDto 
} from '../dto/playlists.dto';

@ApiTags('Playlists')
@Controller({
  path: 'playlists/featured',
  version: '1',
})
export class PlaylistFeaturedController {
  constructor(private readonly playlistFeaturedService: PlaylistFeaturedService) {}

  @Get('paginated')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({ type: ListPaginatedPlaylistsWithOwnerDto })
  async listPaginated(
    @Query() query: ListPaginatedPlaylistsQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
  ) {
    return this.playlistFeaturedService.listPaginated({ query, currentUser });
  }

  @Get('infinite')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({ type: ListInfinitePlaylistsWithOwnerDto })
  async listInfinite(
    @Query() query: ListInfinitePlaylistsQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
  ) {
    return this.playlistFeaturedService.listInfinite({ query, currentUser });
  }
}