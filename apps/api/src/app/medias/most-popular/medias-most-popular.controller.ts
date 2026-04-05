import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { MediasMostPopularService } from './medias-most-popular.service';
import { CurrentLocale } from '../../../common/decorators/current-locale.decorator';
import { SupportedLocale } from '@libs/i18n';
import { 
  ListInfiniteMediasMostPopularDto, 
  ListInfiniteMediasMostPopularQueryDto, 
  ListPaginatedMediasMostPopularDto, 
  ListPaginatedMediasMostPopularQueryDto 
} from './medias-most-popular.dto';

@ApiTags('Medias')
@Controller({
  path: 'medias/most-popular',
  version: '1',
})
export class MediasMostPopularController {
  constructor(private readonly mostPopularService: MediasMostPopularService) {}

  @Get('paginated')
  @ApiOkResponse({
    description: 'Get paginated list of the most popular movies and TV series',
    type: ListPaginatedMediasMostPopularDto,
  })
  async listPaginated(
    @Query() query: ListPaginatedMediasMostPopularQueryDto,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ListPaginatedMediasMostPopularDto> {
    return this.mostPopularService.listPaginated({
      query,
      locale,
    });
  }

  @Get('infinite')
  @ApiOkResponse({
    description: 'Get an infinite scrolling list of the most popular movies and TV series',
    type: ListInfiniteMediasMostPopularDto,
  })
  async listInfinite(
    @Query() query: ListInfiniteMediasMostPopularQueryDto,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ListInfiniteMediasMostPopularDto> {
    return this.mostPopularService.listInfinite({
      query,
      locale,
    });
  }
}