import { Body, Controller, Param, ParseEnumPipe, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PlaylistsAddService } from './playlists-add.service';
import { AuthGuard } from '../../auth/guards';
import { MediaExistsGuard } from '../../../common/guards/media-exists.guard';
import { PlaylistsAddQueryDto } from './playlists-add.dto';
import { CurrentUser } from '../../auth/decorators';
import { User } from '../../auth/auth.service';
import { PlaylistItemDto, PlaylistItemType } from '../items/playlist-items.dto';

@ApiTags('Playlists')
@Controller({
  path: 'playlists/add',
  version: '1',
})
export class PlaylistsAddController {
  constructor(private readonly playlistsAddService: PlaylistsAddService) {}

  @Post(':type/:media_id')
  @UseGuards(AuthGuard, MediaExistsGuard)
  @ApiOkResponse({
    description: 'The media item has been successfully added to the specified playlists.',
    type: PlaylistItemDto,
    isArray: true,
  })
  async add(
    @Param('type', new ParseEnumPipe(PlaylistItemType)) type: PlaylistItemType,
    @Param('media_id', ParseIntPipe) mediaId: number,
    @Body() dto: PlaylistsAddQueryDto,
    @CurrentUser() user: User,
  ) {
    return this.playlistsAddService.add({
      user,
      type,
      mediaId,
      dto,
    });
  }
}