import {
  Controller,
  Param,
  UseGuards,
  Get,
  ParseIntPipe,
  Query,
  Delete,
  Body,
  Patch,
} from '@nestjs/common';
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
  PlaylistItemUpdateDto,
  PlaylistItemWithMediaUnion,
  PlaylistItemWithMovieDto,
  PlaylistItemWithTvSeriesDto,
} from './playlist-items.dto';
import { CurrentOptionalUser, CurrentUser } from '../../auth/decorators';
import { User } from '../../auth/auth.service';

@ApiTags('Playlists')
@Controller({
  path: 'playlist/:playlist_id',
  version: '1',
})
export class PlaylistItemsController {
  constructor(private readonly playlistItemsService: PlaylistItemsService) {}

  @Get('items')
  @UseGuards(OptionalAuthGuard)
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
    @CurrentOptionalUser() currentUser: User | null,
    @Param('playlist_id', ParseIntPipe) playlistId: number,
    @Query() query: ListAllPlaylistItemsQueryDto,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<PlaylistItemWithMediaUnion[]> {
    return this.playlistItemsService.listAll({
      currentUser,
      playlistId,
      query,
      locale,
    });
  }

  @Get('items/paginated')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get a paginated list of items in the playlist.',
    type: ListPaginatedPlaylistItemsDto,
  })
  async listPaginated(
    @CurrentOptionalUser() currentUser: User | null,
    @Param('playlist_id', ParseIntPipe) playlistId: number,
    @Query() query: ListPaginatedPlaylistItemsQueryDto,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ListPaginatedPlaylistItemsDto> {
    return this.playlistItemsService.listPaginated({
      currentUser,
      playlistId,
      query,
      locale,
    });
  }

  @Get('items/infinite')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get an infinite scrolling list of items in the playlist with cursor pagination.',
    type: ListInfinitePlaylistItemsDto,
  })
  async listInfinite(
    @CurrentOptionalUser() currentUser: User | null,
    @Param('playlist_id', ParseIntPipe) playlistId: number,
    @Query() query: ListInfinitePlaylistItemsQueryDto,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ListInfinitePlaylistItemsDto> {
    return this.playlistItemsService.listInfinite({
      currentUser,
      playlistId,
      query,
      locale,
    });
  }

  @Get('item/:item_id')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get a single item in the playlist fully populated.',
    schema: {
      oneOf: [
        { $ref: getSchemaPath(PlaylistItemWithMovieDto) },
        { $ref: getSchemaPath(PlaylistItemWithTvSeriesDto) },
      ],
    },
  })
  async get(
    @CurrentOptionalUser() currentUser: User | null,
    @Param('playlist_id', ParseIntPipe) playlistId: number,
    @Param('item_id', ParseIntPipe) itemId: number,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<PlaylistItemWithMediaUnion> {
    return this.playlistItemsService.get({
      currentUser,
      playlistId,
      itemId,
      locale,
    });
  }

  @Patch('item/:item_id')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Update an item (comment and/or position) in the playlist.',
    type: PlaylistItemDto,
  })
  async update(
    @CurrentUser() user: User,
    @Param('playlist_id', ParseIntPipe) playlistId: number,
    @Param('item_id', ParseIntPipe) itemId: number,
    @Body() dto: PlaylistItemUpdateDto,
  ) {
    return this.playlistItemsService.update({
      user,
      playlistId,
      itemId,
      dto,
    });
  }

  @Delete('items')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Remove items from the playlist.',
    type: PlaylistItemDto,
    isArray: true,
  })
  async delete(
    @CurrentUser() user: User,
    @Param('playlist_id', ParseIntPipe) playlistId: number,
    @Body() dto: PlaylistItemsDeleteDto,
  ) {
    return this.playlistItemsService.delete({
      user,
      playlistId,
      dto,
    });
  }
}
