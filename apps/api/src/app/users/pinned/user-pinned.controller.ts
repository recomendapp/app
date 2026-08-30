import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OptionalAuthGuard } from '../../auth/guards';
import { CurrentOptionalUser } from '../../auth/decorators';
import { User } from '../../auth/auth.service';
import { CurrentLocale } from '../../../common/decorators/current-locale.decorator';
import { SupportedLocale } from '@libs/i18n';
import { ApiErrorDto } from '../../../common/dto/api-error.dto';
import { UserPinnedService } from './user-pinned.service';
import {
  PINNED_ITEM_LIST_SCHEMA,
  PinnedItemUnion,
  PinnedItemWithMovieDto,
  PinnedItemWithPersonDto,
  PinnedItemWithPlaylistDto,
  PinnedItemWithTvSeriesDto,
} from '../../pinned/dto/pinned.dto';

@ApiTags('Users')
@Controller({
  path: 'user/:user_id/pinned',
  version: '1',
})
export class UserPinnedController {
  constructor(private readonly userPinnedService: UserPinnedService) {}

  @Get()
  @UseGuards(OptionalAuthGuard)
  @ApiExtraModels(
    PinnedItemWithMovieDto,
    PinnedItemWithTvSeriesDto,
    PinnedItemWithPlaylistDto,
    PinnedItemWithPersonDto,
  )
  @ApiOkResponse({
    description:
      'Get the pinned items of a profile. The owner sees their full list (even beyond ' +
      "their plan's limit, so they can manage it); anyone else only sees the currently allowed amount.",
    schema: PINNED_ITEM_LIST_SCHEMA,
  })
  @ApiForbiddenResponse({
    description: 'This account is private and the viewer is not an accepted follower.',
    type: ApiErrorDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found.',
    type: ApiErrorDto,
  })
  async list(
    @Param('user_id', ParseUUIDPipe) targetUserId: string,
    @CurrentOptionalUser() currentUser: User | null,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<PinnedItemUnion[]> {
    return this.userPinnedService.list({
      targetUserId,
      currentUser,
      locale,
    });
  }
}
