import { Controller, Param, UseGuards, Get, ParseIntPipe, Query, Delete, Body } from '@nestjs/common';
import { ApiOkResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { AuthGuard, OptionalAuthGuard } from '../../auth/guards';
import { PlaylistItemsService } from './playlist-items.service';
import { CurrentLocale } from '../../../common/decorators/current-locale.decorator';
import { SupportedLocale } from '@libs/i18n';
import { 
  ListAllPlaylistItemsQueryDto, 
  ListInfinitePlaylistItemsDto, 
  ListInfinitePlaylistItemsQueryDto, 
  ListPaginatedPlaylistItemsDto, 
  ListPaginatedPlaylistItemsQueryDto, 
  PlaylistItemDto, 
  PlaylistItemsDeleteDto, 
  PlaylistItemWithMediaUnion, 
  PlaylistItemWithMovieDto, 
  PlaylistItemWithTvSeriesDto 
} from './playlist-items.dto';
import { PlaylistVisibilityGuard } from '../guards/playlist-visibility.guard';
import { PlaylistRolesGuard } from '../guards/playlist-roles.guard';
import { RequirePlaylistRoles } from '../decorators/playlist-roles.decorator';

@ApiTags('Playlists')
@Controller({
  path: 'playlist/:playlist_id/items',
  version: '1',
})
export class PlaylistItemsController {
  constructor(private readonly playlistItemsService: PlaylistItemsService) {}

  @Get()
  @UseGuards(OptionalAuthGuard, PlaylistVisibilityGuard)
  @ApiOkResponse({
    description: 'Get all items in the playlist as a raw array',
    schema: {
      type: 'array',
      items: {
        oneOf: [
          { $ref: getSchemaPath(PlaylistItemWithMovieDto) },
          { $ref: getSchemaPath(PlaylistItemWithTvSeriesDto) },
        ],
        discriminator: {
          propertyName: 'type',
          mapping: {
            movie: getSchemaPath(PlaylistItemWithMovieDto),
            tv_series: getSchemaPath(PlaylistItemWithTvSeriesDto),
          },
        },
      },
    },
  })
  async listAll(
    @Param('playlist_id', ParseIntPipe) playlistId: number,
    @Query() query: ListAllPlaylistItemsQueryDto,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<PlaylistItemWithMediaUnion[]> {
    return this.playlistItemsService.listAll({
      playlistId,
      query,
      locale,
    });
  }

  @Get('paginated')
  @UseGuards(OptionalAuthGuard, PlaylistVisibilityGuard)
  @ApiOkResponse({
    description: 'Get a paginated list of items in the playlist.',
    type: ListPaginatedPlaylistItemsDto,
  })
  async listPaginated(
    @Param('playlist_id', ParseIntPipe) playlistId: number,
    @Query() query: ListPaginatedPlaylistItemsQueryDto,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ListPaginatedPlaylistItemsDto> {
    return this.playlistItemsService.listPaginated({
      playlistId,
      query,
      locale,
    });
  }

  @Get('infinite')
  @UseGuards(OptionalAuthGuard, PlaylistVisibilityGuard)
  @ApiOkResponse({
    description: 'Get an infinite scrolling list of items in the playlist with cursor pagination.',
    type: ListInfinitePlaylistItemsDto,
  })
  async listInfinite(
    @Param('playlist_id', ParseIntPipe) playlistId: number,
    @Query() query: ListInfinitePlaylistItemsQueryDto,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ListInfinitePlaylistItemsDto> {
    return this.playlistItemsService.listInfinite({
      playlistId,
      query,
      locale,
    });
  }

  @Delete('items')
  @UseGuards(AuthGuard, PlaylistRolesGuard)
  @RequirePlaylistRoles('owner', 'admin', 'editor')
  @ApiOkResponse({
    description: 'Remove items from the playlist.',
    type: PlaylistItemDto,
    isArray: true,
  })
  async delete(
    @Param('playlist_id', ParseIntPipe) playlistId: number,
    @Body() dto: PlaylistItemsDeleteDto,
  ) {
    return this.playlistItemsService.delete({
      playlistId,
      dto,
    });
  }
}