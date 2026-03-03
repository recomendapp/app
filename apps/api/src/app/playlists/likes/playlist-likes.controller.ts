import { Controller, Delete, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PlaylistLikesService } from './playlist-likes.service';
import { AuthGuard } from '../../auth/guards';
import { User } from '../../auth/auth.service';
import { CurrentUser } from '../../auth/decorators';
import { PlaylistLikeDto } from './dto/playlist-likes.dto';

@ApiTags('Playlists')
@Controller({
  path: 'playlist/:playlist_id',
  version: '1',
})
export class PlaylistLikesController {
  constructor(private readonly likesService: PlaylistLikesService) {}

  @Get('like')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Get like status of the playlist for the current user.',
    type: Boolean,
  })
  get(
    @CurrentUser() user: User,
    @Param('playlist_id', ParseIntPipe) playlistId: number,
  ) {
    return this.likesService.get({
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
  set(
    @CurrentUser() user: User,
    @Param('playlist_id', ParseIntPipe) playlistId: number,
  ) {
    return this.likesService.set({
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
  delete(
    @CurrentUser() user: User,
    @Param('playlist_id', ParseIntPipe) playlistId: number,
  ) {
    return this.likesService.delete({
      user,
      playlistId,
    });
  }
}