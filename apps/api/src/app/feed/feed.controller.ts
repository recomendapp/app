import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { FeedService } from './feed.service';
import { 
  ListInfiniteFeedDto, 
  ListInfiniteFeedQueryDto, 
  ListPaginatedFeedDto, 
  ListPaginatedFeedQueryDto 
} from './feed.dto';
import { AuthGuard } from '../auth/guards';
import { CurrentUser } from '../auth/decorators';
import { User } from '../auth/auth.service';
import { CurrentLocale } from '../../common/decorators/current-locale.decorator';
import { SupportedLocale } from '@libs/i18n';

@ApiTags('Feed')
@Controller({
  path: 'feed',
  version: '1',
})
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get('paginated')
  @UseGuards(AuthGuard) 
  @ApiOkResponse({
    description: 'Get paginated feed of activities',
    type: ListPaginatedFeedDto,
  })
  async listPaginated(
    @Query() query: ListPaginatedFeedQueryDto,
    @CurrentUser() currentUser: User,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ListPaginatedFeedDto> {
    return this.feedService.listPaginated({ query, currentUser, locale });
  }

  @Get('infinite')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Get an infinite scrolling feed of activities',
    type: ListInfiniteFeedDto,
  })
  async listInfinite(
    @Query() query: ListInfiniteFeedQueryDto,
    @CurrentUser() currentUser: User,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ListInfiniteFeedDto> {
    return this.feedService.listInfinite({ query, currentUser, locale });
  }
}