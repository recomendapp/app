import { Controller, Param, UseGuards, Get, ParseIntPipe, ParseUUIDPipe } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/guards';
import { CurrentUser } from '../../auth/decorators';
import { User } from '../../auth/auth.service';
import { UsersMovieService } from './users-movie.service';
import { UserMovieDto } from './dto/user-movie.dto';
import { CurrentLocale } from '../../../common/decorators/current-locale.decorator';
import { SupportedLocale } from '@libs/i18n';

@ApiTags('Users')
@Controller({
  path: 'user/:user_id/movie/:movie_id',
  version: '1',
})
export class UsersMovieController {
  constructor(private readonly movieService: UsersMovieService) {}

  @Get()
  @UseGuards(AuthGuard)
  @ApiExtraModels(UserMovieDto)
  @ApiOkResponse({
    description: 'Get the movie log for the user',
    schema: {
      nullable: true,
      allOf: [
        { $ref: getSchemaPath(UserMovieDto) }
      ]
    }
  })
  async get(
    @Param('user_id', ParseUUIDPipe) userId: string,
    @Param('movie_id', ParseIntPipe) movieId: number,
    @CurrentUser() currentUser: User,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<UserMovieDto | null> {
    return this.movieService.get({
      userId,
      movieId,
      currentUser,
      locale,
    });
  }
}