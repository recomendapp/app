import { Controller, Param, UseGuards, Get, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { OptionalAuthGuard } from '../../auth/guards';
import { CurrentOptionalUser } from '../../auth/decorators';
import { User } from '../../auth/auth.service';
import { UserFollowingService } from './user-following.service';
import { ListInfiniteUsersDto, ListInfiniteUsersQueryDto, ListUsersDto, ListUsersQueryDto } from '../dto/users.dto';

@ApiTags('Users')
@Controller({
  path: 'user/:user_id/following',
  version: '1',
})
export class UserFollowingController {
  constructor(private readonly followingService: UserFollowingService) {}

  @Get()
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'List of following users',
    type: ListUsersDto,
  })
  async list(
    @Param('user_id', ParseUUIDPipe) targetUserId: string,
    @Query() query: ListUsersQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
  ): Promise<ListUsersDto> {
    return this.followingService.list({
      targetUserId,
      query,
      currentUser,
    });
  }

  @Get('infinite')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get the list of users followed by the user with cursor pagination',
    type: ListInfiniteUsersDto,
  })
  async listInfinite(
    @Param('user_id', ParseUUIDPipe) targetUserId: string,
    @Query() query: ListInfiniteUsersQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
  ): Promise<ListInfiniteUsersDto> {
    return this.followingService.listInfinite({
      targetUserId,
      query,
      currentUser,
    });
  }
}