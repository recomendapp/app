import { Controller, Param, UseGuards, Get, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { OptionalAuthGuard } from '../../../auth/guards';
import { CurrentOptionalUser } from '../../../auth/decorators';
import { User } from '../../../auth/auth.service';
import { UserPlaylistsSavedService } from './user-playlists-saved.service';
import { ListPaginatedPlaylistsWithOwnerDto, ListInfinitePlaylistsWithOwnerDto } from '../../../playlists/dto/playlists.dto';
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
    type: ListPaginatedPlaylistsWithOwnerDto,
  })
  async listPaginated(
    @Param('user_id', ParseUUIDPipe) targetUserId: string,
    @Query() query: ListPaginatedPlaylistsSavedQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
  ): Promise<ListPaginatedPlaylistsWithOwnerDto> {
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
    type: ListInfinitePlaylistsWithOwnerDto,
  })
  async listInfinite(
    @Param('user_id', ParseUUIDPipe) targetUserId: string,
    @Query() query: ListInfinitePlaylistsSavedQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
  ): Promise<ListInfinitePlaylistsWithOwnerDto> {
    return this.playlistService.listInfinite({
      targetUserId,
      query,
      currentUser,
    });
  }
}