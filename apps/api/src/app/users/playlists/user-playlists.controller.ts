import { Controller, Param, UseGuards, Get, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { OptionalAuthGuard } from '../../auth/guards';
import { CurrentOptionalUser } from '../../auth/decorators';
import { User } from '../../auth/auth.service';
import { UserPlaylistsService } from './user-playlists.service';
import { ListPlaylistsQueryDto, ListPlaylistsDto, ListInfinitePlaylistsQueryDto, ListInfinitePlaylistsDto } from '../../playlists/dto/playlists.dto';

@ApiTags('Users')
@Controller({
  path: 'user/:user_id/playlists',
  version: '1',
})
export class UserPlaylistsController {
  constructor(private readonly playlistService: UserPlaylistsService) {}

  @Get()
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'List of playlists',
    type: ListPlaylistsDto,
  })
  async list(
    @Param('user_id', ParseUUIDPipe) targetUserId: string,
    @Query() query: ListPlaylistsQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
  ): Promise<ListPlaylistsDto> {
    return this.playlistService.list({
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