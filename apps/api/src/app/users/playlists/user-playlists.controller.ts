import { Controller, Param, UseGuards, Get, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { OptionalAuthGuard } from '../../auth/guards';
import { CurrentOptionalUser } from '../../auth/decorators';
import { User } from '../../auth/auth.service';
import { UserPlaylistsService } from './user-playlists.service';
import { ListPaginatedPlaylistsQueryDto, ListPaginatedPlaylistsDto, ListInfinitePlaylistsQueryDto, ListInfinitePlaylistsDto } from '../../playlists/dto/playlists.dto';

@ApiTags('Users')
@Controller({
  path: 'user/:user_id/playlists',
  version: '1',
})
export class UserPlaylistsController {
  constructor(private readonly playlistService: UserPlaylistsService) {}

  @Get('paginated')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'List of playlists',
    type: ListPaginatedPlaylistsDto,
  })
  async listPaginated(
    @Param('user_id', ParseUUIDPipe) targetUserId: string,
    @Query() query: ListPaginatedPlaylistsQueryDto,
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
    description: 'Get the list of playlists for the user with cursor pagination',
    type: ListInfinitePlaylistsDto,
  })
  async listInfinite(
    @Param('user_id', ParseUUIDPipe) targetUserId: string,
    @Query() query: ListInfinitePlaylistsQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
  ): Promise<ListInfinitePlaylistsDto> {
    return this.playlistService.listInfinite({
      targetUserId,
      query,
      currentUser,
    });
  }
}