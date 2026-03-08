import { Body, Controller, Get, Param, ParseIntPipe, Put, Query, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PlaylistMembersService } from './playlist-members.service';
import { AuthGuard } from '../../auth/guards';
import { PlaylistRolesGuard } from '../guards/playlist-roles.guard';
import { RequirePlaylistRoles } from '../decorators/playlist-roles.decorator';
import { 
  ListAllPlaylistMembersQueryDto, 
  ListInfinitePlaylistMembersDto, 
  ListInfinitePlaylistMembersQueryDto, 
  ListPaginatedPlaylistMembersDto, 
  ListPaginatedPlaylistMembersQueryDto, 
  PlaylistMemberUpdateDto, 
  PlaylistMemberWithUserDto 
} from './playlist-members.dto';

@ApiTags('Playlists')
@Controller({
  path: 'playlist/:playlist_id/members',
  version: '1',
})
export class PlaylistMembersController {
  constructor(private readonly playlistMembersService: PlaylistMembersService) {}

  @Get()
  @UseGuards(AuthGuard, PlaylistRolesGuard)
  @RequirePlaylistRoles()
  @ApiOkResponse({
    description: 'Get all members in the playlist.',
    type: PlaylistMemberWithUserDto,
    isArray: true,
  })
  listAll(
    @Param('playlist_id', ParseIntPipe) playlistId: number,
    @Query() query: ListAllPlaylistMembersQueryDto,
  ) {
    return this.playlistMembersService.listAll({
      playlistId,
      query,
    });
  }

  @Get('paginated')
  @UseGuards(AuthGuard, PlaylistRolesGuard)
  @RequirePlaylistRoles()
  @ApiOkResponse({
    description: 'Get a paginated list of members in the playlist.',
    type: ListPaginatedPlaylistMembersDto,
  })
  listPaginated(
    @Param('playlist_id', ParseIntPipe) playlistId: number,
    @Query() query: ListPaginatedPlaylistMembersQueryDto,
  ) {
    return this.playlistMembersService.listPaginated({
      playlistId,
      query,
    });
  }

  @Get('infinite')
  @UseGuards(AuthGuard, PlaylistRolesGuard)
  @RequirePlaylistRoles()
  @ApiOkResponse({
    description: 'Get an infinite scrolling list of members in the playlist.',
    type: ListInfinitePlaylistMembersDto,
  })
  listInfinite(
    @Param('playlist_id', ParseIntPipe) playlistId: number,
    @Query() query: ListInfinitePlaylistMembersQueryDto,
  ) {
    return this.playlistMembersService.listInfinite({
      playlistId,
      query,
    });
  }

  @Put()
  @UseGuards(AuthGuard, PlaylistRolesGuard)
  @RequirePlaylistRoles('owner', 'admin')
  @ApiOkResponse({
    description: 'Update the list of members in the playlist. Replaces the current member list.',
    type: PlaylistMemberWithUserDto,
    isArray: true,
  })
  updateAll(
    @Param('playlist_id', ParseIntPipe) playlistId: number,
    @Body() updateMembersDto: PlaylistMemberUpdateDto,
  ) {
    return this.playlistMembersService.updateAll({
      playlistId,
      updateMembersDto,
    });
  }
}