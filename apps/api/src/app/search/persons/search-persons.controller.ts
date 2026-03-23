import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SearchPersonsService } from './search-persons.service';
import { OptionalAuthGuard } from '../../auth/guards';
import { CurrentOptionalUser } from '../../auth/decorators';
import { User } from '../../auth/auth.service';
import { SupportedLocale } from '@libs/i18n';
import { CurrentLocale } from '../../../common/decorators/current-locale.decorator';
import { ListInfinitePersonsDto, ListPaginatedPersonsDto } from '../../persons/dto/persons.dto';
import { ListInfiniteSearchPersonsQueryDto, ListPaginatedSearchPersonsQueryDto } from './search-persons.dto';

@ApiTags('Search')
@Controller({
  path: 'search/persons',
  version: '1',
})
export class SearchPersonsController {
  constructor(private readonly searchPersonsService: SearchPersonsService) {}

  @Get('paginated')
  @ApiOkResponse({
    description: 'Search persons with pagination',
    type: ListPaginatedPersonsDto,
  })
  async listPaginated(
    @CurrentOptionalUser() currentUser: User | null,
    @Query() dto: ListPaginatedSearchPersonsQueryDto,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ListPaginatedPersonsDto> {
    return this.searchPersonsService.listPaginated({
      currentUser,
      dto,
      locale,
    });
  }

  @Get('infinite')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Search persons with infinite scroll',
    type: ListInfinitePersonsDto,
  })
  async listInfinite(
    @CurrentOptionalUser() currentUser: User | null,
    @Query() dto: ListInfiniteSearchPersonsQueryDto,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ListInfinitePersonsDto> {
    return this.searchPersonsService.listInfinite({
      currentUser,
      dto,
      locale,
    });
  }
}
