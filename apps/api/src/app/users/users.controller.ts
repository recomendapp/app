import { Controller, UseGuards, Get, Patch, Body, Param, Query, ParseUUIDPipe, Post, Delete } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UserDto, UpdateUserDto, ListUsersDto, GetUsersQueryDto, ProfileDto } from './dto/users.dto';
import { AuthGuard, OptionalAuthGuard } from '../auth/guards';
import { CurrentOptionalUser, CurrentUser } from '../auth/decorators';
import { User } from '../auth/auth.service';
import { ListPlaylistsDto } from '../playlists/dto/playlists.dto';
import { GetUserPlaylistsQueryDto } from './dto/get-user-playlists.dto';
import { FollowDto } from './dto/user-follow.dto';

@ApiTags('Users')
@Controller({
  path: 'user',
  version: '1',
})
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(OptionalAuthGuard)
  @ApiExtraModels(UserDto)
  @ApiOkResponse({
    description: 'Get the current logged-in user information, null if not authenticated',
    schema: {
      nullable: true,
      allOf: [
        { $ref: getSchemaPath(UserDto) }
      ]
    }
  })
  async getMe(
    @CurrentOptionalUser() user: User | null,
  ): Promise<UserDto | null> {
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
    type: UserDto,
  })
  async updateMe(
    @CurrentUser() user: User,
    @Body() dto: UpdateUserDto,
    // @UploadedFile() avatar?: File,
  ): Promise<UserDto> {
    const avatar = undefined; // TODO: handle avatar upload
    return this.usersService.updateMe(user, dto, avatar);
  }

  @Get(':identifier')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get user profile by UUID or @username',
    type: ProfileDto,
  })
  async getProfile(
    @Param('identifier') identifier: string,
    @CurrentOptionalUser() currentUser: User | null,
  ): Promise<ProfileDto> {
    return this.usersService.getProfile(decodeURIComponent(identifier), currentUser);
  }

  @Get(':user_id/playlists')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'List of playlists',
    type: ListPlaylistsDto,
  })
  async getPlaylists(
    @Param('user_id', ParseUUIDPipe) targetUserId: string,
    @Query() query: GetUserPlaylistsQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
  ): Promise<ListPlaylistsDto> {
    return this.usersService.getPlaylists(targetUserId, query, currentUser);
  }

  /* --------------------------------- Follows -------------------------------- */

  @Get(':user_id/followers')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'List of followers',
    type: ListUsersDto,
  })
  async getFollowers(
    @Param('user_id', ParseUUIDPipe) targetUserId: string,
    @Query() query: GetUsersQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
  ): Promise<ListUsersDto> {
    return this.usersService.getFollowers(targetUserId, query, currentUser);
  }

  @Get(':user_id/following')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'List of following',
    type: ListUsersDto,
  })
  async getFollowing(
    @Param('user_id', ParseUUIDPipe) targetUserId: string,
    @Query() query: GetUsersQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
  ): Promise<ListUsersDto> {
    return this.usersService.getFollowing(targetUserId, query, currentUser);
  }

  @Get(':user_id/follow')
  @UseGuards(AuthGuard)
  @ApiExtraModels(FollowDto)
  @ApiOkResponse({
    description: 'Get follow relationship with the target user',
    schema: {
      nullable: true,
      allOf: [
        { $ref: getSchemaPath(FollowDto) }
      ]
    }
  })
  async getFollowStatus(
    @Param('user_id', ParseUUIDPipe) targetUserId: string,
    @CurrentUser() currentUser: User,
  ): Promise<FollowDto | null> {
    return this.usersService.getFollowStatus(currentUser.id, targetUserId);
  }

  @Post(':user_id/follow')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Follow a user',
    type: FollowDto,
  })
  async followUser(
    @Param('user_id', ParseUUIDPipe) targetUserId: string,
    @CurrentUser() currentUser: User,
  ): Promise<FollowDto> {
    return this.usersService.followUser(currentUser.id, targetUserId);
  }

  @Delete(':user_id/follow')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Unfollow a user',
    type: FollowDto,
  })
  async unfollowUser(
    @Param('user_id', ParseUUIDPipe) targetUserId: string,
    @CurrentUser() currentUser: User,
  ): Promise<FollowDto> {
    return this.usersService.unfollowUser(currentUser.id, targetUserId);
  }
  /* -------------------------------------------------------------------------- */
}