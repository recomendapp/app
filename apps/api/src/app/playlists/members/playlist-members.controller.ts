import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiForbiddenResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PlaylistMembersService } from './playlist-members.service';
import { AuthGuard } from '../../auth/guards';
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
  PlaylistMemberWithUserDto,
} from './playlist-members.dto';
import { ApiErrorDto } from '../../../common/dto/api-error.dto';
import { CurrentUser } from '../../auth/decorators';
import { User } from '../../auth/auth.service';

@ApiTags('Playlists')
@Controller({
  path: 'playlist/:playlist_id',
  version: '1',
})
export class PlaylistMembersController {
  constructor(private readonly playlistMembersService: PlaylistMembersService) {}

  @Get('members')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Get all members in the playlist.',
    type: PlaylistMemberWithUserDto,
    isArray: true,
  })
  listAll(
    @CurrentUser() currentUser: User,
    @Param('playlist_id', ParseIntPipe) playlistId: number,
    @Query() query: ListAllPlaylistMembersQueryDto,
  ) {
    return this.playlistMembersService.listAll({
      currentUser,
      playlistId,
      query,
    });
  }

  @Get('members/paginated')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Get a paginated list of members in the playlist.',
    type: ListPaginatedPlaylistMembersDto,
  })
  listPaginated(
    @CurrentUser() currentUser: User,
    @Param('playlist_id', ParseIntPipe) playlistId: number,
    @Query() query: ListPaginatedPlaylistMembersQueryDto,
  ) {
    return this.playlistMembersService.listPaginated({
      currentUser,
      playlistId,
      query,
    });
  }

  @Get('members/infinite')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Get an infinite scrolling list of members in the playlist.',
    type: ListInfinitePlaylistMembersDto,
  })
  listInfinite(
    @CurrentUser() currentUser: User,
    @Param('playlist_id', ParseIntPipe) playlistId: number,
    @Query() query: ListInfinitePlaylistMembersQueryDto,
  ) {
    return this.playlistMembersService.listInfinite({
      currentUser,
      playlistId,
      query,
    });
  }

  @Post('members')
  @UseGuards(AuthGuard)
  @ApiCreatedResponse({
    description: 'Add new members to the playlist. They will be added as "viewer" by default.',
    type: PlaylistMemberDto,
    isArray: true,
  })
  add(
    @CurrentUser() currentUser: User,
    @Param('playlist_id', ParseIntPipe) playlistId: number,
    @Body() dto: PlaylistMemberAddDto,
  ) {
    return this.playlistMembersService.add({
      currentUser,
      playlistId,
      dto,
    });
  }

  @Patch('member/:user_id')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Update the role of a specific member in the playlist.',
    type: PlaylistMemberDto,
  })
  @ApiForbiddenResponse({
    description: 'User is not allowed to assign this role (e.g., requires Premium).',
    type: ApiErrorDto,
  })
  update(
    @CurrentUser() currentUser: User,
    @Param('playlist_id', ParseIntPipe) playlistId: number,
    @Param('user_id', ParseUUIDPipe) targetUserId: string,
    @Body() dto: PlaylistMemberUpdateDto,
  ) {
    return this.playlistMembersService.update({
      currentUser,
      playlistId,
      targetUserId,
      dto,
    });
  }

  @Delete('members')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Remove members from the playlist.',
    type: PlaylistMemberDto,
    isArray: true,
  })
  delete(
    @CurrentUser() currentUser: User,
    @Param('playlist_id', ParseIntPipe) playlistId: number,
    @Body() removeMembersDto: PlaylistMemberDeleteDto,
  ) {
    return this.playlistMembersService.delete({
      currentUser,
      playlistId,
      userIds: removeMembersDto.userIds,
    });
  }
}
