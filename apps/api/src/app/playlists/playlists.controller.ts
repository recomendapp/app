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
      user,
      playlistId: playlistId,
      updatePlaylistDto,
    });
  }

  @Post(':playlist_id/duplicate')
  @UseGuards(AuthGuard)
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
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'The playlist has been successfully deleted.',
    type: PlaylistDto,
  })
  delete(@CurrentUser() user: User, @Param('playlist_id', ParseIntPipe) playlistId: number) {
    return this.playlistsService.delete({
      user,
      playlistId: playlistId,
    });
  }
}
