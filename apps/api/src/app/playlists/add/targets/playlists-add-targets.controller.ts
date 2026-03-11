import { Controller, Param, ParseIntPipe, ParseEnumPipe, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../auth/decorators';
import { User } from '../../../auth/auth.service';
import { AuthGuard } from '../../../auth/guards';
import { MediaExistsGuard } from '../../../../common/guards/media-exists.guard';
import { PlaylistsAddTargetsService } from './playlists-add-targets.service';
import { 
  ListAllPlaylistsAddTargetsQueryDto, 
  ListInfinitePlaylistsAddTargetsDto, 
  ListInfinitePlaylistsAddTargetsQueryDto, 
  ListPaginatedPlaylistsAddTargetsDto, 
  ListPaginatedPlaylistsAddTargetsQueryDto, 
  PlaylistsAddTargetDto 
} from './playlists-add-targets.dto';
import { PlaylistItemType } from '../../items/playlist-items.dto';

@ApiTags('Playlists')
@Controller({
  path: 'playlists/add/:type/:media_id/targets',
  version: '1',
})
export class PlaylistsAddTargetsController {
  constructor(private readonly targetsService: PlaylistsAddTargetsService) {}

  @Get()
  @UseGuards(AuthGuard, MediaExistsGuard)
  @ApiOkResponse({ type: PlaylistsAddTargetDto, isArray: true })
  async listAll(
    @Param('type', new ParseEnumPipe(PlaylistItemType)) type: PlaylistItemType,
    @Param('media_id', ParseIntPipe) mediaId: number,
    @Query() query: ListAllPlaylistsAddTargetsQueryDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.targetsService.listAll({ currentUser, type, mediaId, query });
  }

  @Get('paginated')
  @UseGuards(AuthGuard, MediaExistsGuard)
  @ApiOkResponse({ type: ListPaginatedPlaylistsAddTargetsDto })
  async listPaginated(
    @Param('type', new ParseEnumPipe(PlaylistItemType)) type: PlaylistItemType,
    @Param('media_id', ParseIntPipe) mediaId: number,
    @Query() query: ListPaginatedPlaylistsAddTargetsQueryDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.targetsService.listPaginated({ currentUser, type, mediaId, query });
  }

  @Get('infinite')
  @UseGuards(AuthGuard, MediaExistsGuard)
  @ApiOkResponse({ type: ListInfinitePlaylistsAddTargetsDto })
  async listInfinite(
    @Param('type', new ParseEnumPipe(PlaylistItemType)) type: PlaylistItemType,
    @Param('media_id', ParseIntPipe) mediaId: number,
    @Query() query: ListInfinitePlaylistsAddTargetsQueryDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.targetsService.listInfinite({ currentUser, type, mediaId, query });
  }
}