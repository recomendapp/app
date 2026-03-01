import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PersonTvSeriesService } from './person-tv-series.service';
import { CurrentLocale } from '../../../common/decorators/current-locale.decorator';
import { SupportedLocale } from '@libs/i18n';
import { ListInfinitePersonTvSeriesDto, ListInfinitePersonTvSeriesQueryDto, ListPaginatedPersonTvSeriesQueryDto, ListPaginatedPersonTvSeriesDto, PersonTvSeriesFacetsDto } from './dto/person-tv-series.dto';

@ApiTags('Persons')
@Controller({
  path: 'person/:person_id',
  version: '1',
})
export class PersonTvSeriesController {
  constructor(private readonly tvSeriesService: PersonTvSeriesService) {}

  @Get('tv-series/paginated')
  @ApiOkResponse({
    description: 'Get the list of tv-series for the person',
    type: ListPaginatedPersonTvSeriesDto,
  })
  async listPaginated(
    @Param('person_id', ParseIntPipe) personId: number,
    @Query() query: ListPaginatedPersonTvSeriesQueryDto,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ListPaginatedPersonTvSeriesDto> {
    return this.tvSeriesService.listPaginated({ personId, query, locale });
  }

  @Get('tv-series/infinite')
  @ApiOkResponse({
    description: 'Get the list of tv-series for the person with cursor pagination',
    type: ListInfinitePersonTvSeriesDto,
  })
  async listInfinite(
    @Param('person_id', ParseIntPipe) personId: number,
    @Query() query: ListInfinitePersonTvSeriesQueryDto,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ListInfinitePersonTvSeriesDto> {
    return this.tvSeriesService.listInfinite({ personId, query, locale });
  }

  @Get('tv-series/facets')
  @ApiOkResponse({
    description: 'Get the facets for the person tv-series',
    type: PersonTvSeriesFacetsDto,
  })
  async facets(
    @Param('person_id', ParseIntPipe) personId: number,
  ): Promise<PersonTvSeriesFacetsDto> {
    return this.tvSeriesService.getFacets({ personId });
  }
}