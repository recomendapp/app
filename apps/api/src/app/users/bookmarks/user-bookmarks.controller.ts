import { Controller, Param, UseGuards, Get, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { OptionalAuthGuard } from '../../auth/guards';
import { CurrentOptionalUser } from '../../auth/decorators';
import { User } from '../../auth/auth.service';
import { UserBookmarksService } from './user-bookmarks.service';
import { ListBookmarksDto, ListBookmarksQueryDto, ListInfiniteBookmarksDto, ListInfiniteBookmarksQueryDto } from '../../bookmarks/dto/bookmarks.dto';
import { CurrentLocale } from '../../../common/decorators/current-locale.decorator';
import { SupportedLocale } from '@libs/i18n';

@ApiTags('Users')
@Controller({
  path: 'user/:user_id/bookmarks',
  version: '1',
})
export class UserBookmarksController {
  constructor(private readonly usersService: UserBookmarksService) {}

  @Get()
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'List of bookmarks',
    type: ListBookmarksDto,
  })
  async list(
    @Param('user_id', ParseUUIDPipe) targetUserId: string,
    @Query() query: ListBookmarksQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ListBookmarksDto> {
    return this.usersService.list({
      targetUserId,
      query,
      currentUser,
      locale,
    });
  }

  @Get('infinite')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get the list of bookmarks for the user with cursor pagination',
    type: ListInfiniteBookmarksDto,
  })
  async listInfinite(
    @Param('user_id', ParseUUIDPipe) targetUserId: string,
    @Query() query: ListInfiniteBookmarksQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ListInfiniteBookmarksDto> {
    return this.usersService.listInfinite({
      targetUserId,
      query,
      currentUser,
      locale,
    });
  }
}