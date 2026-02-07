import { Controller, UseGuards, Get, Patch, UseInterceptors, Body, UploadedFile, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiConsumes, ApiExtraModels, ApiOkResponse, ApiOperation, ApiResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UserDTO, UpdateUserDto } from './dto/users.dto';
import { AuthGuard, OptionalAuthGuard } from '../auth/guards';
import { CurrentOptionalUser, CurrentUser } from '../auth/decorators';
import { User } from '../auth/auth.service';
import { ListPlaylistsDto } from '../playlists/dto/playlists.dto';
import { GetUserPlaylistsQueryDto } from './dto/get-user-playlists.dto';

@ApiTags('Users')
@Controller({
  path: 'user',
  version: '1',
})
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get the current logged-in user information, null if not authenticated',
    type: UserDTO,
  })
  async getMe(
    @CurrentOptionalUser() user: User | null,
  ): Promise<UserDTO | null> {
    if (!user) return null;
    return this.usersService.getMe(user);
  }

  @Patch('me')
  @UseGuards(AuthGuard)
  // @UseInterceptors(FileInterceptor('avatar'))
  // @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 200,
    description: 'Update the current logged-in user information',
    type: UserDTO,
  })
  async updateMe(
    @CurrentUser() user: User,
    @Body() dto: UpdateUserDto,
    // @UploadedFile() avatar?: File,
  ): Promise<UserDTO> {
    const avatar = undefined; // TODO: handle avatar upload
    return this.usersService.updateMe(user, dto, avatar);
  }

  @Get(':userId/playlists')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'List of playlists',
    type: ListPlaylistsDto,
  })
  async getPlaylists(
    @Param('userId', ParseUUIDPipe) targetUserId: string,
    @Query() query: GetUserPlaylistsQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
  ): Promise<ListPlaylistsDto> {
    return this.usersService.getPlaylists(targetUserId, query, currentUser);
  }
}