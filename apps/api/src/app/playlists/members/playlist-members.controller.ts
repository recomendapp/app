import { Body, Controller, Delete, Get, Param, ParseIntPipe, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiCreatedResponse, ApiForbiddenResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
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
  PlaylistMemberAddDto, 
  PlaylistMemberDeleteDto, 
  PlaylistMemberDto, 
  PlaylistMemberUpdateDto, 
  PlaylistMemberWithUserDto 
} from './playlist-members.dto';
import { ApiErrorDto } from '../../../common/dto/api-error.dto';

@ApiTags('Playlists')
@Controller({
  path: 'playlist/:playlist_id',
  version: '1',
})
export class PlaylistMembersController {
  constructor(private readonly playlistMembersService: PlaylistMembersService) {}

  @Get('members')
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

  @Get('members/paginated')
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

  @Get('members/infinite')
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

  @Post('members')
  @UseGuards(AuthGuard, PlaylistRolesGuard)
  @RequirePlaylistRoles('owner', 'admin')
  @ApiCreatedResponse({
    description: 'Add new members to the playlist. They will be added as "viewer" by default.',
    type: PlaylistMemberDto,
    isArray: true,
  })
  add(
    @Param('playlist_id', ParseIntPipe) playlistId: number,
    @Body() dto: PlaylistMemberAddDto,
  ) {
    return this.playlistMembersService.add({
      playlistId,
      dto,
    });
  }

  @Patch('member/:user_id')
  @UseGuards(AuthGuard, PlaylistRolesGuard)
  @RequirePlaylistRoles('owner', 'admin')
  @ApiOkResponse({
    description: 'Update the role of a specific member in the playlist.',
    type: PlaylistMemberDto,
  })
  @ApiForbiddenResponse({ 
    description: 'User is not allowed to assign this role (e.g., requires Premium).',
    type: ApiErrorDto, 
  })
  update(
    @Param('playlist_id', ParseIntPipe) playlistId: number,
    @Param('user_id', ParseUUIDPipe) targetUserId: string,
    @Body() dto: PlaylistMemberUpdateDto,
  ) {
    return this.playlistMembersService.update({
      playlistId,
      targetUserId,
      dto,
    });
  }

  @Delete('members')
  @UseGuards(AuthGuard, PlaylistRolesGuard)
  @RequirePlaylistRoles('owner', 'admin')
  @ApiOkResponse({
    description: 'Remove members from the playlist.',
    type: PlaylistMemberDto,
    isArray: true,
  })
  delete(
    @Param('playlist_id', ParseIntPipe) playlistId: number,
    @Body() removeMembersDto: PlaylistMemberDeleteDto,
  ) {
    return this.playlistMembersService.delete({
      playlistId,
      userIds: removeMembersDto.userIds,
    });
  }
}