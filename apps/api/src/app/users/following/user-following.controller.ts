import { Controller, Param, UseGuards, Get, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { OptionalAuthGuard } from '../../auth/guards';
import { CurrentOptionalUser } from '../../auth/decorators';
import { User } from '../../auth/auth.service';
import { UserFollowingService } from './user-following.service';
import { ListInfiniteUsersDto, ListInfiniteUsersQueryDto, ListPaginatedUsersDto, ListPaginatedUsersQueryDto } from '../dto/users.dto';

@ApiTags('Users')
@Controller({
  path: 'user/:user_id/following',
  version: '1',
})
export class UserFollowingController {
  constructor(private readonly followingService: UserFollowingService) {}

  @Get('paginated')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'List of following users',
    type: ListPaginatedUsersDto,
  })
  async listPaginated(
    @Param('user_id', ParseUUIDPipe) targetUserId: string,
    @Query() query: ListPaginatedUsersQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
  ): Promise<ListPaginatedUsersDto> {
    return this.followingService.listPaginated({
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