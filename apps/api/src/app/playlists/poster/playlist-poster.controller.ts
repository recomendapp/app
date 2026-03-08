import { BadRequestException, Controller, Delete, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PlaylistPosterService } from './playlist-poster.service';
import { AuthGuard } from '../../auth/guards';
import { PlaylistPosterUploadDto } from './dto/playlist-poster.dto';
import { FastifyRequest } from 'fastify';
import { PlaylistDto } from '../dto/playlists.dto';
import { PlaylistRolesGuard } from '../guards/playlist-roles.guard';
import { RequirePlaylistRoles } from '../decorators/playlist-roles.decorator';

@ApiTags('Playlists')
@Controller({
  path: 'playlist/:playlist_id/poster',
  version: '1',
})
export class PlaylistPosterController {
  constructor(private readonly playlistPosterService: PlaylistPosterService) {}

  @Post()
  @UseGuards(AuthGuard, PlaylistRolesGuard)
  @RequirePlaylistRoles('owner', 'admin')
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
    });
  }

  @Delete()
  @UseGuards(AuthGuard, PlaylistRolesGuard)
  @RequirePlaylistRoles('owner', 'admin')
  @ApiOkResponse({
    description: 'Poster deleted successfully',
    type: PlaylistDto,
  })
  async delete(
    @Param('playlist_id', ParseIntPipe) playlistId: number,
  ): Promise<PlaylistDto> {
    return this.playlistPosterService.delete({
      playlistId,
    });
  }
}