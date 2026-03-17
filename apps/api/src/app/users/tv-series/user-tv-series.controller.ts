import { Controller, Param, UseGuards, Get, ParseIntPipe, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { OptionalAuthGuard } from '../../auth/guards';
import { CurrentOptionalUser } from '../../auth/decorators';
import { User } from '../../auth/auth.service';
import { UserTvSeriesService } from './user-tv-series.service';
import { CurrentLocale } from '../../../common/decorators/current-locale.decorator';
import { SupportedLocale } from '@libs/i18n';
import { ListInfiniteUserTvSeriesWithTvSeriesDto, ListPaginatedUserTvSeriesWithTvSeriesDto, UserTvSeriesWithUserTvSeriesDto } from './user-tv-series.dto';
import { ListInfiniteLogsTvSeriesQueryDto, ListPaginatedLogsTvSeriesQueryDto } from '../../tv-series/logs/tv-series-logs.dto';

@ApiTags('Users')
@Controller({
  path: 'user/:user_id',
  version: '1',
})
export class UserTvSeriesController {
  constructor(private readonly tvSeriesService: UserTvSeriesService) {}

  @Get('tv-series/:tv_series_id')
  @UseGuards(OptionalAuthGuard)
  @ApiExtraModels(UserTvSeriesWithUserTvSeriesDto)
  @ApiOkResponse({
    description: 'Get the tv series log for the user',
    schema: {
      nullable: true,
      allOf: [
        { $ref: getSchemaPath(UserTvSeriesWithUserTvSeriesDto) }
      ]
    }
  })
  async get(
    @Param('user_id', ParseUUIDPipe) userId: string,
    @Param('tv_series_id', ParseIntPipe) tvSeriesId: number,
    @CurrentOptionalUser() currentUser: User | null,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<UserTvSeriesWithUserTvSeriesDto | null> {
    return this.tvSeriesService.get({
      userId,
      tvSeriesId,
      currentUser,
      locale,
    });
  }

  @Get('tv-series/paginated')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get the list of tv series logs for the user',
    type: ListPaginatedUserTvSeriesWithTvSeriesDto,
  })
  async listPaginated(
    @Param('user_id', ParseUUIDPipe) userId: string,
    @Query() query: ListPaginatedLogsTvSeriesQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ListPaginatedUserTvSeriesWithTvSeriesDto> {
    return this.tvSeriesService.listPaginated({
      userId,
      query,
      currentUser,
      locale,
    });
  }

  @Get('tv-series/infinite')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get the list of tv series logs for the user with cursor pagination',
    type: ListInfiniteUserTvSeriesWithTvSeriesDto,
  })
  async listInfinite(
    @Param('user_id', ParseUUIDPipe) userId: string,
    @Query() query: ListInfiniteLogsTvSeriesQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ListInfiniteUserTvSeriesWithTvSeriesDto> {
    return this.tvSeriesService.listInfinite({
      userId,
      query,
      currentUser,
      locale,
    });
  }

}