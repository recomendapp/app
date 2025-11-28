import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { OptionalJwtAuthGuard } from '../../auth/guards/optional-jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersSearchService } from './users-search.service';
import { SearchUsersQueryDto } from './dto/search-users-query.dto';
import { SearchUsersResponseDto } from './dto/search-users-response.dto';

@ApiTags('Search')
@Controller({
  path: 'search/users',
  version: '1',
})
export class UsersSearchController {
  constructor(private readonly usersSearchService: UsersSearchService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Search users',
    description: 'Search for users using full-text search.',
  })
  @ApiResponse({
    status: 200,
    description: 'Users found successfully',
    type: SearchUsersResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters',
  })
  async search(
    @Query() query: SearchUsersQueryDto,
  ): Promise<SearchUsersResponseDto> {
    const result = await this.usersSearchService.search(query);
    return new SearchUsersResponseDto(result);
  }
}
