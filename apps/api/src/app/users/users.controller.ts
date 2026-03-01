import { Controller, UseGuards, Get, Patch, Body, Param, ParseUUIDPipe, Post, Delete } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UserDto, UpdateUserDto, ProfileDto } from './dto/users.dto';
import { AuthGuard, OptionalAuthGuard } from '../auth/guards';
import { CurrentOptionalUser, CurrentUser } from '../auth/decorators';
import { User } from '../auth/auth.service';
import { FollowDto } from './follow/dto/user-follow.dto';

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
}