import { Controller, Param, UseGuards, ParseIntPipe, Get, Query } from '@nestjs/common';
import { MoviePlaylistsService } from './movie-playlists.service';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { OptionalAuthGuard } from '../../auth/guards';
import { CurrentOptionalUser } from '../../auth/decorators';
import { User } from '../../auth/auth.service';
import { ListInfinitePlaylistsQueryDto, ListInfinitePlaylistsWithOwnerDto, ListPlaylistsQueryDto, ListPlaylistsWithOwnerDto } from '../../playlists/dto/playlists.dto';

@ApiTags('Movies')
@Controller({
  path: 'movie/:movie_id',
  version: '1',
})
export class MoviePlaylistsController {
  constructor(private readonly playlistService: MoviePlaylistsService) {}

  @Get('playlists')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get the list of playlists of the movie',
    type: ListPlaylistsWithOwnerDto,
  })
  async list(
    @Param('movie_id', ParseIntPipe) movieId: number,
    @Query() query: ListPlaylistsQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
  ): Promise<ListPlaylistsWithOwnerDto> {
    return this.playlistService.list({
      movieId,
      query,
      currentUser,
    })
  }

  @Get('playlists/infinite')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get the list of playlists of the movie with cursor pagination',
    type: ListInfinitePlaylistsWithOwnerDto,
  })
  async listInfinite(
    @Param('movie_id', ParseIntPipe) movieId: number,
    @Query() query: ListInfinitePlaylistsQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
  ): Promise<ListInfinitePlaylistsWithOwnerDto> {
    return this.playlistService.listInfinite({
      movieId,
      query,
      currentUser,
    });
  }
}