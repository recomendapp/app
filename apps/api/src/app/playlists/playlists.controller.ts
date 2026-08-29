import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PlaylistsService } from './playlists.service';
import {
  PlaylistDto,
  PlaylistCreateDto,
  PlaylistUpdateDto,
  PlaylistWithOwnerDto,
} from './dto/playlists.dto';
import { AuthGuard, OptionalAuthGuard } from '../auth/guards';
import { User } from '../auth/auth.service';
import { CurrentOptionalUser, CurrentUser } from '../auth/decorators';
import { RequirePlaylistRoles } from './decorators/playlist-roles.decorator';
import { PlaylistRolesGuard } from './guards/playlist-roles.guard';
import { PlaylistVisibilityGuard } from './guards/playlist-visibility.guard';
import { CurrentPlaylistRole } from './decorators/current-playlist-role.decorator';
import { PlaylistRole } from './types/playlist-role.type';
import { PremiumGuard } from '../../common/guards/premium.guard';

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
    type: PlaylistWithOwnerDto,
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
    type: PlaylistDto,
  })
  create(@CurrentUser() user: User, @Body() createPlaylistDto: PlaylistCreateDto) {
    return this.playlistsService.create(user, createPlaylistDto);
  }

  @Patch(':playlist_id')
  @UseGuards(AuthGuard, PlaylistRolesGuard)
  @RequirePlaylistRoles('owner', 'admin')
  @ApiOkResponse({
    description: 'The playlist has been successfully updated.',
    type: PlaylistDto,
  })
  update(
    @CurrentPlaylistRole() role: PlaylistRole,
    @Param('playlist_id', ParseIntPipe) playlistId: number,
    @Body() updatePlaylistDto: PlaylistUpdateDto,
  ) {
    return this.playlistsService.update({
      role,
      playlistId: playlistId,
      updatePlaylistDto,
    });
  }

  @Post(':playlist_id/duplicate')
  @UseGuards(AuthGuard, PremiumGuard, PlaylistVisibilityGuard)
  @ApiCreatedResponse({
    description: 'The playlist has been successfully duplicated.',
    type: PlaylistDto,
  })
  duplicate(@CurrentUser() user: User, @Param('playlist_id', ParseIntPipe) playlistId: number) {
    return this.playlistsService.duplicate({
      user,
      playlistId: playlistId,
    });
  }

  @Delete(':playlist_id')
  @UseGuards(AuthGuard, PlaylistRolesGuard)
  @RequirePlaylistRoles('owner')
  @ApiOkResponse({
    description: 'The playlist has been successfully deleted.',
    type: PlaylistDto,
  })
  delete(@Param('playlist_id', ParseIntPipe) playlistId: number) {
    return this.playlistsService.delete({
      playlistId: playlistId,
    });
  }
}
