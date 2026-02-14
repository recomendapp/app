import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PlaylistsService } from './playlists.service';
import { PlaylistDto, PlaylistCreateDto, PlaylistUpdateDto, PlaylistGetDTO } from './dto/playlists.dto';
import { AuthGuard, OptionalAuthGuard } from '../auth/guards';
import { User } from '../auth/auth.service';
import { CurrentOptionalUser, CurrentUser } from '../auth/decorators';
import { PlaylistMemberListDto, PlaylistMemberUpdateDto } from './dto/playlist-members.dto';
import { PlaylistSavedDto } from './dto/playlist-saved.dto';
import { PlaylistLikeDto } from './dto/playlist-likes.dto';

@ApiTags('Playlists')
@Controller({
  path: 'playlist',
  version: '1',
})
export class PlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) {}

  @Get(':playlist_id')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'The playlist details.',
    type: PlaylistGetDTO,
  })
  get(
    @CurrentOptionalUser() user: User | null,
    @Param('playlist_id', ParseIntPipe) playlistId: number,
  ) {
    return this.playlistsService.get({
      playlistId: playlistId,
      user: user,
    });
  }

  @Post()
  @UseGuards(AuthGuard)
  @ApiCreatedResponse({ 
    description: 'The playlist has been successfully created.',
    type: PlaylistDto
  }) 
  create(
    @CurrentUser() user: User,
    @Body() createPlaylistDto: PlaylistCreateDto,
  ) {
    return this.playlistsService.create(user, createPlaylistDto);
  }

  @Patch(':playlist_id')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'The playlist has been successfully updated.',
    type: PlaylistDto,
  })
  update(
    @CurrentUser() user: User,
    @Param('playlist_id', ParseIntPipe) playlistId: number, 
    @Body() updatePlaylistDto: PlaylistUpdateDto,
  ) {
    return this.playlistsService.update({
      user: user,
      playlistId: playlistId,
      updatePlaylistDto,
    });
  }

  @Delete(':playlist_id')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'The playlist has been successfully deleted.',
    type: PlaylistDto,
  })
  delete(
    @CurrentUser() user: User,
    @Param('playlist_id', ParseIntPipe) playlistId: number,
  ) {
    return this.playlistsService.delete({
      user,
      playlistId: playlistId,
    });
  }

  // Members
  @Get(':playlist_id/members')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'The list of members in the playlist.',
    type: PlaylistMemberListDto,
  })
  getMembers(
    @CurrentUser() user: User,
    @Param('playlist_id', ParseIntPipe) playlistId: number,
  ) {
    return this.playlistsService.getMembers({
      user,
      playlistId,
    });
  }

  @Put(':playlist_id/members')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'The current user has left the playlist. If the user is the owner, the playlist will be deleted.',
    type: PlaylistMemberListDto,
  })
  updateMembers(
    @CurrentUser() user: User,
    @Param('playlist_id', ParseIntPipe) playlistId: number,
    @Body() updateMembersDto: PlaylistMemberUpdateDto,
  ) {
    return this.playlistsService.updateMembers({
      user,
      playlistId,
      updateMembersDto,
    });
  };

  // Save
  @Get(':playlist_id/save')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Get save status of the playlist for the current user.',
    type: Boolean,
  })
  getSaveStatus(
    @CurrentUser() user: User,
    @Param('playlist_id', ParseIntPipe) playlistId: number,
  ) {
    return this.playlistsService.getSaveStatus({
      user,
      playlistId,
    });
  }

  @Post(':playlist_id/save')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Save the playlist for the current user.',
    type: PlaylistSavedDto,
  })
  save(
    @CurrentUser() user: User,
    @Param('playlist_id', ParseIntPipe) playlistId: number,
  ) {
    return this.playlistsService.save({
      user,
      playlistId,
    });
  }

  @Delete(':playlist_id/save')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Unsave the playlist for the current user.',
    type: PlaylistSavedDto,
  })
  unsave(
    @CurrentUser() user: User,
    @Param('playlist_id', ParseIntPipe) playlistId: number,
  ) {
    return this.playlistsService.unsave({
      user,
      playlistId,
    });
  }

  // Like
  @Get(':playlist_id/like')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Get like status of the playlist for the current user.',
    type: Boolean,
  })
  getLikeStatus(
    @CurrentUser() user: User,
    @Param('playlist_id', ParseIntPipe) playlistId: number,
  ) {
    return this.playlistsService.getLikeStatus({
      user,
      playlistId,
    });
  }

  @Post(':playlist_id/like')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Like the playlist for the current user.',
    type: PlaylistLikeDto,
  })
  like(
    @CurrentUser() user: User,
    @Param('playlist_id', ParseIntPipe) playlistId: number,
  ) {
    return this.playlistsService.like({
      user,
      playlistId,
    });
  }

  @Delete(':playlist_id/like')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Unlike the playlist for the current user.',
    type: PlaylistLikeDto,
  })
  unlike(
    @CurrentUser() user: User,
    @Param('playlist_id', ParseIntPipe) playlistId: number,
  ) {
    return this.playlistsService.unlike({
      user,
      playlistId,
    });
  }
}