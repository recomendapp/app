import { Controller, Param, UseGuards, ParseIntPipe, Get, Query } from '@nestjs/common';
import { TvSeriesPlaylistsService } from './tv-series-playlists.service';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { OptionalAuthGuard } from '../../auth/guards';
import { CurrentOptionalUser } from '../../auth/decorators';
import { User } from '../../auth/auth.service';
import { ListInfinitePlaylistsQueryDto, ListInfinitePlaylistsWithOwnerDto, ListPlaylistsQueryDto, ListPlaylistsWithOwnerDto } from '../../playlists/dto/playlists.dto';

@ApiTags('Tv Series')
@Controller({
  path: 'tv-series/:tv_series_id',
  version: '1',
})
export class TvSeriesPlaylistsController {
  constructor(private readonly playlistService: TvSeriesPlaylistsService) {}

  @Get('playlists')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get the list of playlists of the tv series',
    type: ListPlaylistsWithOwnerDto,
  })
  async list(
    @Param('tv_series_id', ParseIntPipe) tvSeriesId: number,
    @Query() query: ListPlaylistsQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
  ): Promise<ListPlaylistsWithOwnerDto> {
    return this.playlistService.list({
      tvSeriesId,
      query,
      currentUser,
    })
  }

  @Get('playlists/infinite')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get the list of playlists of the tv series with cursor pagination',
    type: ListInfinitePlaylistsWithOwnerDto,
  })
  async listInfinite(
    @Param('tv_series_id', ParseIntPipe) tvSeriesId: number,
    @Query() query: ListInfinitePlaylistsQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
  ): Promise<ListInfinitePlaylistsWithOwnerDto> {
    return this.playlistService.listInfinite({
      tvSeriesId,
      query,
      currentUser,
    });
  }
}