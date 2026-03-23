import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SearchUsersService } from './search-users.service';
import { OptionalAuthGuard } from '../../auth/guards';
import { CurrentOptionalUser } from '../../auth/decorators';
import { User } from '../../auth/auth.service';
import { ListInfiniteUsersDto, ListPaginatedUsersDto } from '../../users/dto/users.dto';
import { ListInfiniteSearchUsersQueryDto, ListPaginatedSearchUsersQueryDto } from './search-users.dto';

@ApiTags('Search')
@Controller({
  path: 'search/users',
  version: '1',
})
export class SearchUsersController {
  constructor(private readonly searchUsersService: SearchUsersService) {}

  @Get('paginated')
  @ApiOkResponse({
    description: 'Search users with pagination',
    type: ListPaginatedUsersDto,
  })
  async listPaginated(
    @CurrentOptionalUser() currentUser: User | null,
    @Query() dto: ListPaginatedSearchUsersQueryDto,
  ): Promise<ListPaginatedUsersDto> {
    return this.searchUsersService.listPaginated({
      currentUser,
      dto,
    });
  }

  @Get('infinite')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Search users with infinite scroll',
    type: ListInfiniteUsersDto,
  })
  async listInfinite(
    @CurrentOptionalUser() currentUser: User | null,
    @Query() dto: ListInfiniteSearchUsersQueryDto,
  ): Promise<ListInfiniteUsersDto> {
    return this.searchUsersService.listInfinite({
      currentUser,
      dto,
    });
  }
}
