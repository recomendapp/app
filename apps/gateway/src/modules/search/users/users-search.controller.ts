import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { OptionalAuthGuard } from '@app/shared';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersSearchService } from './users-search.service';
import { SearchUsersQueryDto } from './dto/search-users-query.dto';
import { SearchUsersResponse } from './dto/search-users-response.dto';

@ApiTags('Search')
@Controller({
  path: 'search/users',
  version: '1',
})
export class UsersSearchController {
  constructor(private readonly usersSearchService: UsersSearchService) {}

  @Get()
  @UseGuards(OptionalAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Search users',
    description: 'Search for users using full-text search.',
  })
  @ApiResponse({
    status: 200,
    description: 'Users found successfully',
    type: SearchUsersResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters',
  })
  async search(
    @Query() query: SearchUsersQueryDto,
  ): Promise<SearchUsersResponse> {
    const result = await this.usersSearchService.search(query);
    return new SearchUsersResponse(result);
  }
}
