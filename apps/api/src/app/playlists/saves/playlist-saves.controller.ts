import { Controller, Delete, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PlaylistSavesService } from './playlist-saves.service';
import { AuthGuard } from '../../auth/guards';
import { User } from '../../auth/auth.service';
import { CurrentUser } from '../../auth/decorators';
import { PlaylistSavedDto } from './dto/playlist-saved.dto';

@ApiTags('Playlists')
@Controller({
  path: 'playlist/:playlist_id',
  version: '1',
})
export class PlaylistSavesController {
  constructor(private readonly savedService: PlaylistSavesService) {}

  @Get('save')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Get save status of the playlist for the current user.',
    type: Boolean,
  })
  get(
    @CurrentUser() user: User,
    @Param('playlist_id', ParseIntPipe) playlistId: number,
  ) {
    return this.savedService.get({
      user,
      playlistId,
    });
  }

  @Post('save')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Save the playlist for the current user.',
    type: PlaylistSavedDto,
  })
  set(
    @CurrentUser() user: User,
    @Param('playlist_id', ParseIntPipe) playlistId: number,
  ) {
    return this.savedService.set({
      user,
      playlistId,
    });
  }

  @Delete('save')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Unsave the playlist for the current user.',
    type: PlaylistSavedDto,
  })
  delete(
    @CurrentUser() user: User,
    @Param('playlist_id', ParseIntPipe) playlistId: number,
  ) {
    return this.savedService.delete({
      user,
      playlistId,
    });
  }
}