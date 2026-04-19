import { Controller, UseGuards, Get, Query, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { OptionalAuthGuard } from '../../auth/guards';
import { CurrentOptionalUser } from '../../auth/decorators';
import { User } from '../../auth/auth.service';
import { CurrentLocale } from '../../../common/decorators/current-locale.decorator';
import { SupportedLocale } from '@libs/i18n';
import { ListInfiniteFeedDto, ListInfiniteFeedQueryDto, ListPaginatedFeedDto, ListPaginatedFeedQueryDto } from '../../feed/feed.dto';
import { FeedService } from '../../feed/feed.service';

@ApiTags('Users')
@Controller({
  path: 'user/:user_id/feed',
  version: '1',
})
export class UserFeedController {
  constructor(private readonly feedService: FeedService) {}
  
  @Get('paginated')
  @UseGuards(OptionalAuthGuard) 
  @ApiOkResponse({
    description: 'Get paginated feed of activities',
    type: ListPaginatedFeedDto,
  })
  async listPaginated(
    @Param('user_id', ParseUUIDPipe) targetUserId: string,
    @Query() query: ListPaginatedFeedQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ListPaginatedFeedDto> {
    return this.feedService.listPaginated({
      query,
      currentUser,
      locale,
      targetUserId,
    });
  }

  @Get('infinite')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get an infinite scrolling feed of activities',
    type: ListInfiniteFeedDto,
  })
  async listInfinite(
    @Param('user_id', ParseUUIDPipe) targetUserId: string,
    @Query() query: ListInfiniteFeedQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ListInfiniteFeedDto> {
    return this.feedService.listInfinite({
      query,
      currentUser,
      locale,
      targetUserId,
    });
  }
}