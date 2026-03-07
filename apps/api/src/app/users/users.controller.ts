import { Controller, UseGuards, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { ListInfiniteUsersDto, ListInfiniteUsersQueryDto, ListPaginatedUsersDto, ListPaginatedUsersQueryDto, ProfileDto } from './dto/users.dto';
import { OptionalAuthGuard } from '../auth/guards';
import { CurrentOptionalUser } from '../auth/decorators';
import { User } from '../auth/auth.service';

@ApiTags('Users')
@Controller({
  version: '1',
})
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('user/:identifier')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get user profile by UUID or @username',
    type: ProfileDto,
  })
  async get(
    @Param('identifier') identifier: string,
    @CurrentOptionalUser() currentUser: User | null,
  ): Promise<ProfileDto> {
    return this.usersService.get(decodeURIComponent(identifier), currentUser);
  }

  /* ---------------------------------- List ---------------------------------- */
  @Get('users/paginated')
  @ApiOkResponse({
    description: 'List of users',
    type: ListPaginatedUsersDto,
  })
  async listPaginated(
    @Query() query: ListPaginatedUsersQueryDto,
  ): Promise<ListPaginatedUsersDto> {
    return this.usersService.listPaginated(query);
  }

  @Get('users/infinite')
  @ApiOkResponse({
    description: 'Get the list of users with cursor pagination',
    type: ListInfiniteUsersDto,
  })
  async listInfinite(
    @Query() query: ListInfiniteUsersQueryDto,
  ): Promise<ListInfiniteUsersDto> {
    return this.usersService.listInfinite(query);
  }
}