import { Controller, UseGuards, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../../auth/guards';
import { CurrentUser } from '../../../auth/decorators';
import { User } from '../../../auth/auth.service';
import { 
  ListPaginatedPlaylistsQueryDto, 
  ListInfinitePlaylistsQueryDto, 
  ListPaginatedPlaylistsWithOwnerDto, 
  ListInfinitePlaylistsWithOwnerDto 
} from '../../../playlists/dto/playlists.dto';
import { MePlaylistsFollowingService } from './me-playlists-following.service';

@ApiTags('Me')
@Controller({
  path: 'me/playlists/following',
  version: '1',
})
export class MePlaylistsFollowingController {
  constructor(private readonly playlistsService: MePlaylistsFollowingService) {}

  @Get('paginated')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'List of playlists from users the current user is following',
    type: ListPaginatedPlaylistsWithOwnerDto,
  })
  async listPaginated(
    @Query() query: ListPaginatedPlaylistsQueryDto,
    @CurrentUser() currentUser: User,
  ): Promise<ListPaginatedPlaylistsWithOwnerDto> {
    return this.playlistsService.listPaginated({
      query,
      currentUser,
    });
  }

  @Get('infinite')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Infinite list of playlists from followed users',
    type: ListInfinitePlaylistsWithOwnerDto,
  })
  async listInfinite(
    @Query() query: ListInfinitePlaylistsQueryDto,
    @CurrentUser() currentUser: User,
  ): Promise<ListInfinitePlaylistsWithOwnerDto> {
    return this.playlistsService.listInfinite({
      query,
      currentUser,
    });
  }
}