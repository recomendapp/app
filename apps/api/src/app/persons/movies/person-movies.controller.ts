import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PersonMoviesService } from './person-movies.service';
import { ListInfinitePersonMoviesDto, ListInfinitePersonMoviesQueryDto, ListPersonMovieQueryDto, ListPersonMoviesDto, PersonMovieFacetsDto } from './dto/person-movie.dto';
import { CurrentLocale } from '../../../common/decorators/current-locale.decorator';
import { SupportedLocale } from '@libs/i18n';

@ApiTags('Persons')
@Controller({
  path: 'person/:person_id',
  version: '1',
})
export class PersonMoviesController {
  constructor(private readonly movieService: PersonMoviesService) {}

  @Get('movies')
  @ApiOkResponse({
    description: 'Get the list of movies for the person',
    type: ListPersonMoviesDto,
  })
  async list(
    @Param('person_id', ParseIntPipe) personId: number,
    @Query() query: ListPersonMovieQueryDto,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ListPersonMoviesDto> {
    return this.movieService.list({ personId, query, locale });
  }

  @Get('movies/infinite')
  @ApiOkResponse({
    description: 'Get the list of movies for the person with cursor pagination',
    type: ListInfinitePersonMoviesDto,
  })
  async listInfinite(
    @Param('person_id', ParseIntPipe) personId: number,
    @Query() query: ListInfinitePersonMoviesQueryDto,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ListInfinitePersonMoviesDto> {
    return this.movieService.listInfinite({ personId, query, locale });
  }

  @Get('movies/facets')
  @ApiOkResponse({
    description: 'Get the facets for the person movies',
    type: PersonMovieFacetsDto,
  })
  async facets(
    @Param('person_id', ParseIntPipe) personId: number,
  ): Promise<PersonMovieFacetsDto> {
    return this.movieService.getFacets({ personId });
  }
}