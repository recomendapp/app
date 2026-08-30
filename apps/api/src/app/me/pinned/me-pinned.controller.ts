import {
  Body,
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../../auth/guards';
import { CurrentUser } from '../../auth/decorators';
import { User } from '../../auth/auth.service';
import { CurrentLocale } from '../../../common/decorators/current-locale.decorator';
import { SupportedLocale } from '@libs/i18n';
import { ApiErrorDto } from '../../../common/dto/api-error.dto';
import { MePinnedService } from './me-pinned.service';
import {
  PINNED_ITEM_UNION_SCHEMA,
  PinnedItemCreateDto,
  PinnedItemDto,
  PinnedItemUnion,
  PinnedItemUpdateDto,
  PinnedItemWithMovieDto,
  PinnedItemWithPersonDto,
  PinnedItemWithPlaylistDto,
  PinnedItemWithTvSeriesDto,
  PinnedItemsDeleteDto,
  PinnedLimitReachedErrorDto,
} from '../../pinned/dto/pinned.dto';

@ApiTags('Me')
@Controller({
  path: 'me/pinned',
  version: '1',
})
export class MePinnedController {
  constructor(private readonly mePinnedService: MePinnedService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiExtraModels(
    PinnedItemWithMovieDto,
    PinnedItemWithTvSeriesDto,
    PinnedItemWithPlaylistDto,
    PinnedItemWithPersonDto,
  )
  @ApiOkResponse({
    description: 'Pin a movie, tv series, or playlist to your profile.',
    schema: PINNED_ITEM_UNION_SCHEMA,
  })
  @ApiForbiddenResponse({
    description:
      "The plan's pin limit has been reached (free: 4, premium: 10). " +
      '`upgradable` tells the client whether upgrading would raise the limit.',
    type: PinnedLimitReachedErrorDto,
  })
  @ApiConflictResponse({
    description: 'This item is already pinned.',
    type: ApiErrorDto,
  })
  @ApiNotFoundResponse({
    description: 'The movie, tv series, person, or playlist was not found, or is not accessible.',
    type: ApiErrorDto,
  })
  async add(
    @Body() dto: PinnedItemCreateDto,
    @CurrentUser() currentUser: User,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<PinnedItemUnion> {
    return this.mePinnedService.add({ currentUser, dto, locale });
  }

  @Patch(':pinned_item_id')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Reorder a pinned item.',
    type: PinnedItemDto,
  })
  @ApiNotFoundResponse({
    description: 'Pinned item not found.',
    type: ApiErrorDto,
  })
  async update(
    @Param('pinned_item_id', ParseIntPipe) pinnedItemId: number,
    @Body() dto: PinnedItemUpdateDto,
    @CurrentUser() currentUser: User,
  ): Promise<PinnedItemDto> {
    return this.mePinnedService.update({ currentUser, pinnedItemId, dto });
  }

  @Delete()
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Unpin one or more items.',
    type: PinnedItemDto,
    isArray: true,
  })
  async delete(
    @Body() dto: PinnedItemsDeleteDto,
    @CurrentUser() currentUser: User,
  ): Promise<PinnedItemDto[]> {
    return this.mePinnedService.delete({ currentUser, dto });
  }
}
