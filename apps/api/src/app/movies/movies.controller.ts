import { Controller, Param, Get, ParseIntPipe, UseGuards, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { MovieDto } from './dto/movies.dto';
import { MoviesService } from './movies.service';
import { OptionalAuthGuard } from '../auth/guards';
import { CurrentOptionalUser } from '../auth/decorators';
import { User } from '../auth/auth.service';
import { CurrentLocale } from '../../common/decorators/current-locale.decorator';
import { SupportedLocale } from '@libs/i18n';
import { GetReviewsMovieQueryDto, ListReviewMovieDto } from '../reviews/movie/dto/reviews-movie.dto';
import { GetPlaylistsQueryDto, ListPlaylistsWithOwnerDto } from '../playlists/dto/playlists.dto';
import { MovieCastingDto } from './dto/movie-credits.dto';

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
  async get(
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

  @Get(':movie_id/casting')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get the movie casting information',
    type: [MovieCastingDto],
  })
  async getCasting(
    @Param('movie_id', ParseIntPipe) movieId: number,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<MovieCastingDto[]> {
    return this.moviesService.getCasting({
      movieId,
      locale,
    });
  }

  @Get(':movie_id/reviews')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get reviews of the movie',
    type: ListReviewMovieDto,
  })
  async getReviews(
    @Param('movie_id', ParseIntPipe) movieId: number,
    @Query() query: GetReviewsMovieQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
  ): Promise<ListReviewMovieDto> {
    return this.moviesService.getReviews({
      movieId,
      query,
      currentUser,
    })
  }

  @Get(':movie_id/playlists')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get playlists of the movie',
    type: ListPlaylistsWithOwnerDto,
  })
  async getPlaylists(
    @Param('movie_id', ParseIntPipe) movieId: number,
    @Query() query: GetPlaylistsQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
  ): Promise<ListPlaylistsWithOwnerDto> {
    return this.moviesService.getPlaylists({
      movieId,
      query,
      currentUser,
    })
  }
}