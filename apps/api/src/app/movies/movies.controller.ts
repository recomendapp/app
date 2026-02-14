import { Controller, Param, Get, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { MovieDto } from './dto/movies.dto';
import { MoviesService } from './movies.service';
import { OptionalAuthGuard } from '../auth/guards';
import { CurrentOptionalUser } from '../auth/decorators';
import { User } from '../auth/auth.service';
import { CurrentLocale } from '../../common/decorators/current-locale.decorator';
import { SupportedLocale } from '@libs/i18n';

@ApiTags('Movies')
@Controller({
  path: 'movie',
  version: '1',
})
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get(':movie_id')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get the movie details',
    type: MovieDto,
  })
  async getMovie(
    @Param('movie_id', ParseIntPipe) movieId: number,
    @CurrentOptionalUser() currentUser: User | null,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<MovieDto> {
    return this.moviesService.get({
      movieId,
      currentUser,
      locale,
    });
  }
}