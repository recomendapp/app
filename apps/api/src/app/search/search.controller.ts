import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { OptionalAuthGuard } from '../auth/guards';
import { CurrentOptionalUser } from '../auth/decorators';
import { User } from '../auth/auth.service';
import { SupportedLocale } from '@libs/i18n';
import { CurrentLocale } from '../../common/decorators/current-locale.decorator';
import { SearchQueryDto, SearchResponseDto } from './search.dto';

@ApiTags('Search')
@Controller({
  path: 'search',
  version: '1',
})
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Global search returning results across all categories',
    type: SearchResponseDto,
  })
  async search(
    @CurrentOptionalUser() currentUser: User | null,
    @Query() dto: SearchQueryDto,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<SearchResponseDto> {
    return this.searchService.search({
      currentUser,
      locale,
      dto,
    });
  }
}