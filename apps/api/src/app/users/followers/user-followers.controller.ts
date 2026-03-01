import { Controller, Param, UseGuards, Get, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { OptionalAuthGuard } from '../../auth/guards';
import { CurrentOptionalUser } from '../../auth/decorators';
import { User } from '../../auth/auth.service';
import { UserFollowersService } from './user-followers.service';
import { ListInfiniteUsersDto, ListInfiniteUsersQueryDto, ListPaginatedUsersDto, ListPaginatedUsersQueryDto } from '../dto/users.dto';

@ApiTags('Users')
@Controller({
  path: 'user/:user_id/followers',
  version: '1',
})
export class UserFollowersController {
  constructor(private readonly followerService: UserFollowersService) {}

  @Get('paginated')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'List of followers',
    type: ListPaginatedUsersDto,
  })
  async listPaginated(
    @Param('user_id', ParseUUIDPipe) targetUserId: string,
    @Query() query: ListPaginatedUsersQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
  ): Promise<ListPaginatedUsersDto> {
    return this.followerService.listPaginated({
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