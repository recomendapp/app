import { Controller, Param, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { ExploreItemsService } from './explore-items.service';
import { CurrentLocale } from '../../../common/decorators/current-locale.decorator';
import { Cacheable } from '../../../common/decorators/cacheable.decorator';
import { CACHE_TTL } from '../../../config/cache-ttl';
import { SupportedLocale } from '@libs/i18n';
import {
  ListAllExploreItemsQueryDto,
  ListInfiniteExploreItemsDto,
  ListInfiniteExploreItemsQueryDto,
  ListPaginatedExploreItemsDto,
  ListPaginatedExploreItemsQueryDto,
  ExploreItemWithMediaUnion,
  ExploreItemWithMovieDto,
  ExploreItemWithTvSeriesDto,
} from './explore-items.dto';

@ApiTags('Explore')
@Controller({
  path: 'explore/:identifier',
  version: '1',
})
export class ExploreItemsController {
  constructor(private readonly exploreItemsService: ExploreItemsService) {}

  @Get('items')
  @Cacheable('explore-items-all', CACHE_TTL.TWO_DAYS)
  @ApiOkResponse({
    description: 'Get all items of the explore map as a raw array',
    schema: {
      type: 'array',
      items: {
        oneOf: [
          { $ref: getSchemaPath(ExploreItemWithMovieDto) },
          { $ref: getSchemaPath(ExploreItemWithTvSeriesDto) },
        ],
        discriminator: {
          propertyName: 'type',
          mapping: {
            movie: getSchemaPath(ExploreItemWithMovieDto),
            tv_series: getSchemaPath(ExploreItemWithTvSeriesDto),
          },
        },
      },
    },
  })
  async listAll(
    @Param('identifier') identifier: string,
    @Query() query: ListAllExploreItemsQueryDto,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ExploreItemWithMediaUnion[]> {
    return this.exploreItemsService.listAll({
      identifier: decodeURIComponent(identifier),
      query,
      locale,
    });
  }

  @Get('items/paginated')
  @Cacheable('explore-items-paginated', CACHE_TTL.TWO_DAYS)
  @ApiOkResponse({
    description: 'Get a paginated list of items of the explore map.',
    type: ListPaginatedExploreItemsDto,
  })
  async listPaginated(
    @Param('identifier') identifier: string,
    @Query() query: ListPaginatedExploreItemsQueryDto,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ListPaginatedExploreItemsDto> {
    return this.exploreItemsService.listPaginated({
      identifier: decodeURIComponent(identifier),
      query,
      locale,
    });
  }

  @Get('items/infinite')
  @Cacheable('explore-items-infinite', CACHE_TTL.TWO_DAYS)
  @ApiOkResponse({
    description:
      'Get an infinite scrolling list of items of the explore map with cursor pagination.',
    type: ListInfiniteExploreItemsDto,
  })
  async listInfinite(
    @Param('identifier') identifier: string,
    @Query() query: ListInfiniteExploreItemsQueryDto,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ListInfiniteExploreItemsDto> {
    return this.exploreItemsService.listInfinite({
      identifier: decodeURIComponent(identifier),
      query,
      locale,
    });
  }
}
