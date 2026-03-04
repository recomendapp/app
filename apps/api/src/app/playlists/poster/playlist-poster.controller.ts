import { BadRequestException, Controller, Delete, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PLaylistPosterService } from './playlist-poster.service';
import { AuthGuard } from '../../auth/guards';
import { PlaylistPosterUploadDto } from './dto/playlist-poster.dto';
import { FastifyRequest } from 'fastify';
import { CurrentUser } from '../../auth/decorators';
import { User } from '../../auth/auth.service';
import { PlaylistDto } from '../dto/playlists.dto';

@ApiTags('Playlists')
@Controller({
  path: 'playlist/:playlist_id/poster',
  version: '1',
})
export class PLaylistPosterController {
  constructor(private readonly playlistPosterService: PLaylistPosterService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Poster file',
    type: PlaylistPosterUploadDto,
  })
  @ApiOkResponse({
    description: 'Poster updated successfully',
    type: PlaylistDto,
  })
  async set(
    @Req() req: FastifyRequest,
    @Param('playlist_id', ParseIntPipe) playlistId: number,
    @CurrentUser() currentUser: User,
  ): Promise<PlaylistDto> {
    if (!req.isMultipart()) {
      throw new BadRequestException('Request is not multipart/form-data');
    }

    const file = await req.file();
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return this.playlistPosterService.set({
      playlistId,
      file,
      currentUser,
    });
  }

  @Delete()
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Poster deleted successfully',
    type: PlaylistDto,
  })
  async delete(
    @Param('playlist_id', ParseIntPipe) playlistId: number,
    @CurrentUser() currentUser: User,
  ): Promise<PlaylistDto> {
    return this.playlistPosterService.delete({
      playlistId,
      currentUser,
    });
  }
}