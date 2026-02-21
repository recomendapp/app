import { Controller, Param, UseGuards, Get, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { OptionalAuthGuard } from '../../auth/guards';
import { CurrentOptionalUser } from '../../auth/decorators';
import { User } from '../../auth/auth.service';
import { UserFollowersService } from './user-followers.service';
import { ListInfiniteUsersDto, ListInfiniteUsersQueryDto, ListUsersDto, ListUsersQueryDto } from '../dto/users.dto';

@ApiTags('Users')
@Controller({
  path: 'user/:user_id/followers',
  version: '1',
})
export class UserFollowersController {
  constructor(private readonly followerService: UserFollowersService) {}

  @Get()
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'List of followers',
    type: ListUsersDto,
  })
  async list(
    @Param('user_id', ParseUUIDPipe) targetUserId: string,
    @Query() query: ListUsersQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
  ): Promise<ListUsersDto> {
    return this.followerService.list({
      targetUserId,
      query,
      currentUser,
    });
  }

  @Get('infinite')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get the list of followers for the user with cursor pagination',
    type: ListInfiniteUsersDto,
  })
  async listInfinite(
    @Param('user_id', ParseUUIDPipe) targetUserId: string,
    @Query() query: ListInfiniteUsersQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
  ): Promise<ListInfiniteUsersDto> {
    return this.followerService.listInfinite({
      targetUserId,
      query,
      currentUser,
    });
  }
}