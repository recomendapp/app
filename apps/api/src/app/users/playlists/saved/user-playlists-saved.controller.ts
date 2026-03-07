import { Controller, Param, UseGuards, Get, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { OptionalAuthGuard } from '../../../auth/guards';
import { CurrentOptionalUser } from '../../../auth/decorators';
import { User } from '../../../auth/auth.service';
import { UserPlaylistsSavedService } from './user-playlists-saved.service';
import { ListPaginatedPlaylistsDto, ListInfinitePlaylistsDto } from '../../../playlists/dto/playlists.dto';
import { ListInfinitePlaylistsSavedQueryDto, ListPaginatedPlaylistsSavedQueryDto } from '../../../playlists/saves/dto/playlist-saved.dto';

@ApiTags('Users')
@Controller({
  path: 'user/:user_id/playlists/saved',
  version: '1',
})
export class UserPlaylistsSavedController {
  constructor(private readonly playlistService: UserPlaylistsSavedService) {}

  @Get('paginated')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'List of playlists saved by the user',
    type: ListPaginatedPlaylistsDto,
  })
  async listPaginated(
    @Param('user_id', ParseUUIDPipe) targetUserId: string,
    @Query() query: ListPaginatedPlaylistsSavedQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
  ): Promise<ListPaginatedPlaylistsDto> {
    return this.playlistService.listPaginated({
      targetUserId,
      query,
      currentUser,
    });
  }

  @Get('infinite')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get the list of playlists saved by the user with cursor pagination',
    type: ListInfinitePlaylistsDto,
  })
  async listInfinite(
    @Param('user_id', ParseUUIDPipe) targetUserId: string,
    @Query() query: ListInfinitePlaylistsSavedQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
  ): Promise<ListInfinitePlaylistsDto> {
    return this.playlistService.listInfinite({
      targetUserId,
      query,
      currentUser,
    });
  }
}