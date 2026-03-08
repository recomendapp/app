import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { FeedPersonsService } from './feed-persons.service';
import { AuthGuard } from '../../auth/guards';
import { ListInfinitePersonFeedDto, ListInfinitePersonFeedQueryDto, ListPaginatedPersonFeedDto, ListPaginatedPersonFeedQueryDto } from '../../persons/feed/dto/person-feed.dto';
import { CurrentUser } from '../../auth/decorators';
import { CurrentLocale } from '../../../common/decorators/current-locale.decorator';
import { PremiumGuard } from '../../../common/guards/premium.guard';
import { User } from '../../auth/auth.service';
import { SupportedLocale } from '@libs/i18n';

@ApiTags('Feed')
@Controller({
  path: 'feed/persons',
  version: '1',
})
export class FeedPersonsController {
  constructor(private readonly feedPersonService: FeedPersonsService) {}

  @Get('paginated')
  @UseGuards(AuthGuard, PremiumGuard) 
  @ApiOkResponse({
    description: 'Get paginated feed of recent media from followed persons (Premium only)',
    type: ListPaginatedPersonFeedDto,
  })
  async listPaginated(
    @Query() query: ListPaginatedPersonFeedQueryDto,
    @CurrentUser() currentUser: User,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ListPaginatedPersonFeedDto> {
    return this.feedPersonService.listPaginated({ query, currentUser, locale });
  }

  @Get('infinite')
  @UseGuards(AuthGuard, PremiumGuard)
  @ApiOkResponse({
    description: 'Get an infinite scrolling feed of recent media from followed persons (Premium only)',
    type: ListInfinitePersonFeedDto,
  })
  async listInfinite(
    @Query() query: ListInfinitePersonFeedQueryDto,
    @CurrentUser() currentUser: User,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ListInfinitePersonFeedDto> {
    return this.feedPersonService.listInfinite({ query, currentUser, locale });
  }
}