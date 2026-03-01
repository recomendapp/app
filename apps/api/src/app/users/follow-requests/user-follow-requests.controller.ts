import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserFollowRequestsService } from './user-follow-requests.service';
import { AuthGuard } from '../../auth/guards';
import { ListInfiniteFollowRequestsDto, ListInfiniteFollowRequestsQueryDto, ListPaginatedFollowRequestsDto, ListPaginatedFollowRequestsQueryDto } from './dto/user-follow-requests.dto';
import { User } from '../../auth/auth.service';
import { CurrentUser } from '../../auth/decorators';

@ApiTags('Users')
@Controller({
  path: 'user/me/follow-requests',
  version: '1',
})
export class UserFollowRequestsController {
  constructor(private readonly followRequestsService: UserFollowRequestsService) {}

  @Get('paginated')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Get paginated list of pending follow requests',
    type: ListPaginatedFollowRequestsDto,
  })
  async listPaginated(
    @CurrentUser() currentUser: User,
    @Query() query: ListPaginatedFollowRequestsQueryDto,
  ) {
    return this.followRequestsService.listPaginated({
      currentUserId: currentUser.id,
      query,
    });
  }

  @Get('infinite')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Get the list of pending follow requests with cursor pagination',
    type: ListInfiniteFollowRequestsDto,
  })
  async listInfinite(
    @CurrentUser() currentUser: User,
    @Query() query: ListInfiniteFollowRequestsQueryDto,
  ) {
    return this.followRequestsService.listInfinite({
      currentUserId: currentUser.id,
      query,
    });
  }
}