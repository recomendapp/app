import { Controller, Param, UseGuards, Get, ParseIntPipe, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { OptionalAuthGuard } from '../../auth/guards';
import { CurrentOptionalUser } from '../../auth/decorators';
import { User } from '../../auth/auth.service';
import { UserMoviesService } from './user-movies.service';
import { ListInfiniteUserMovieWithMovieDto, ListUserMovieWithMovieDto, UserMovieWithUserMovieDto } from './dto/user-movie.dto';
import { CurrentLocale } from '../../../common/decorators/current-locale.decorator';
import { SupportedLocale } from '@libs/i18n';
import { ListInfiniteLogsMovieQueryDto, ListLogsMovieQueryDto } from '../../movies/log/dto/log-movie.dto';

@ApiTags('Users')
@Controller({
  path: 'user/:user_id',
  version: '1',
})
export class UserMoviesController {
  constructor(private readonly movieService: UserMoviesService) {}

  @Get('movie/:movie_id')
  @UseGuards(OptionalAuthGuard)
  @ApiExtraModels(UserMovieWithUserMovieDto)
  @ApiOkResponse({
    description: 'Get the movie log for the user',
    schema: {
      nullable: true,
      allOf: [
        { $ref: getSchemaPath(UserMovieWithUserMovieDto) }
      ]
    }
  })
  async get(
    @Param('user_id', ParseUUIDPipe) userId: string,
    @Param('movie_id', ParseIntPipe) movieId: number,
    @CurrentOptionalUser() currentUser: User | null,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<UserMovieWithUserMovieDto | null> {
    return this.movieService.get({
      userId,
      movieId,
      currentUser,
      locale,
    });
  }

  @Get('movies')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get the list of movie logs for the user',
    type: ListUserMovieWithMovieDto,
  })
  async list(
    @Param('user_id', ParseUUIDPipe) userId: string,
    @Query() query: ListLogsMovieQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ListUserMovieWithMovieDto> {
    return this.movieService.list({
      userId,
      query,
      currentUser,
      locale,
    });
  }

  @Get('movies/infinite')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get the list of movie logs for the user with cursor pagination',
    type: ListInfiniteUserMovieWithMovieDto,
  })
  async listInfinite(
    @Param('user_id', ParseUUIDPipe) userId: string,
    @Query() query: ListInfiniteLogsMovieQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ListInfiniteUserMovieWithMovieDto> {
    return this.movieService.listInfinite({
      userId,
      query,
      currentUser,
      locale,
    });
  }

}