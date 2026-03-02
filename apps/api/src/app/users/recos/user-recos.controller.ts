import { Controller, Param, UseGuards, Get, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { OptionalAuthGuard } from '../../auth/guards';
import { CurrentOptionalUser } from '../../auth/decorators';
import { User } from '../../auth/auth.service';
import { UserRecosService } from './user-recos.service';
import { CurrentLocale } from '../../../common/decorators/current-locale.decorator';
import { SupportedLocale } from '@libs/i18n';
import { ListAllRecosQueryDto, ListInfiniteRecosDto, ListInfiniteRecosQueryDto, ListPaginatedRecosDto, ListPaginatedRecosQueryDto, RecoWithMediaUnion, RecoWithMovieDto, RecoWithTvSeriesDto } from '../../recos/dto/recos.dto';

@ApiTags('Users')
@Controller({
  path: 'user/:user_id/recos',
  version: '1',
})
export class UserRecosController {
  constructor(private readonly usersService: UserRecosService) {}

  @Get()
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get all recos for the user as a raw array',
    schema: {
      type: 'array',
      items: {
        oneOf: [
          { $ref: getSchemaPath(RecoWithMovieDto) },
          { $ref: getSchemaPath(RecoWithTvSeriesDto) },
        ],
        discriminator: {
          propertyName: 'type',
          mapping: {
            movie: getSchemaPath(RecoWithMovieDto),
            tv_series: getSchemaPath(RecoWithTvSeriesDto),
          },
        },
      },
    },
  })
  async listAll(
    @Param('user_id', ParseUUIDPipe) targetUserId: string,
    @Query() query: ListAllRecosQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<RecoWithMediaUnion[]> {
    return this.usersService.listAll({
      targetUserId,
      query,
      currentUser,
      locale,
    });
  }

  @Get('paginated')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'List of recos for the user with pagination',
    type: ListPaginatedRecosDto,
  })
  async listPaginated(
    @Param('user_id', ParseUUIDPipe) targetUserId: string,
    @Query() query: ListPaginatedRecosQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ListPaginatedRecosDto> {
    return this.usersService.listPaginated({
      targetUserId,
      query,
      currentUser,
      locale,
    });
  }

  @Get('infinite')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get the list of recos for the user with cursor pagination',
    type: ListInfiniteRecosDto,
  })
  async listInfinite(
    @Param('user_id', ParseUUIDPipe) targetUserId: string,
    @Query() query: ListInfiniteRecosQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ListInfiniteRecosDto> {
    return this.usersService.listInfinite({
      targetUserId,
      query,
      locale,
      currentUser
    });
  }
}