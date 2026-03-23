import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SearchMoviesService } from './search-movies.service';
import { OptionalAuthGuard } from '../../auth/guards';
import { CurrentOptionalUser } from '../../auth/decorators';
import { User } from '../../auth/auth.service';
import { ListInfiniteMoviesDto, ListPaginatedMoviesDto } from '../../movies/dto/movies.dto';
import { ListInfiniteSearchMoviesQueryDto, ListPaginatedSearchMoviesQueryDto } from './search-movies.dto';
import { SupportedLocale } from '@libs/i18n';
import { CurrentLocale } from '../../../common/decorators/current-locale.decorator';

@ApiTags('Search')
@Controller({
  path: 'search/films',
  version: '1',
})
export class SearchMoviesController {
  constructor(private readonly searchMoviesService: SearchMoviesService) {}

  @Get('paginated')
  @ApiOkResponse({
    description: 'Search movies with pagination',
    type: ListPaginatedMoviesDto,
  })
  async listPaginated(
    @CurrentOptionalUser() currentUser: User | null,
    @Query() dto: ListPaginatedSearchMoviesQueryDto,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ListPaginatedMoviesDto> {
    return this.searchMoviesService.listPaginated({
      currentUser,
      dto,
      locale,
    });
  }

  @Get('infinite')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Search movies with infinite scroll',
    type: ListInfiniteMoviesDto,
  })
  async listInfinite(
    @CurrentOptionalUser() currentUser: User | null,
    @Query() dto: ListInfiniteSearchMoviesQueryDto,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ListInfiniteMoviesDto> {
    return this.searchMoviesService.listInfinite({
      currentUser,
      dto,
      locale,
    });
  }
}
