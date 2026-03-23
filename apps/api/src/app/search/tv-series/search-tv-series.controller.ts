import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SearchTvSeriesService } from './search-tv-series.service';
import { OptionalAuthGuard } from '../../auth/guards';
import { CurrentOptionalUser } from '../../auth/decorators';
import { User } from '../../auth/auth.service';
import { SupportedLocale } from '@libs/i18n';
import { CurrentLocale } from '../../../common/decorators/current-locale.decorator';
import { ListInfiniteTvSeriesDto, ListPaginatedTvSeriesDto } from '../../tv-series/dto/tv-series.dto';
import { ListInfiniteSearchTvSeriesQueryDto, ListPaginatedSearchTvSeriesQueryDto } from './search-tv-series.dto';

@ApiTags('Search')
@Controller({
  path: 'search/tv-series',
  version: '1',
})
export class SearchTvSeriesController {
  constructor(private readonly searchTvSeriesService: SearchTvSeriesService) {}

  @Get('paginated')
  @ApiOkResponse({
    description: 'Search tv series with pagination',
    type: ListPaginatedTvSeriesDto,
  })
  async listPaginated(
    @CurrentOptionalUser() currentUser: User | null,
    @Query() dto: ListPaginatedSearchTvSeriesQueryDto,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ListPaginatedTvSeriesDto> {
    return this.searchTvSeriesService.listPaginated({
      currentUser,
      dto,
      locale,
    });
  }

  @Get('infinite')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Search tv series with infinite scroll',
    type: ListInfiniteTvSeriesDto,
  })
  async listInfinite(
    @CurrentOptionalUser() currentUser: User | null,
    @Query() dto: ListInfiniteSearchTvSeriesQueryDto,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ListInfiniteTvSeriesDto> {
    return this.searchTvSeriesService.listInfinite({
      currentUser,
      dto,
      locale,
    });
  }
}
