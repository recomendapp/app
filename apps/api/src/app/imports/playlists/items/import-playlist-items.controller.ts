import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../../auth/guards';
import { CurrentUser } from '../../../auth/decorators';
import { User } from '../../../auth/auth.service';
import { CurrentLocale } from '../../../../common/decorators/current-locale.decorator';
import { SupportedLocale } from '@libs/i18n';
import { PaginationQueryDto } from '../../../../common/dto/pagination.dto';
import { CursorPaginationQueryDto } from '../../../../common/dto/cursor-pagination.dto';
import { ImportPlaylistItemsService } from './import-playlist-items.service';
import {
  ImportJobPlaylistItemDto,
  ListInfiniteImportPlaylistItemsDto,
  ListPaginatedImportPlaylistItemsDto,
  PatchImportJobPlaylistItemDto,
} from './import-playlist-items.dto';

@ApiTags('Imports')
@Controller({ path: 'imports/:id/playlists/:playlistId/items', version: '1' })
export class ImportPlaylistItemsController {
  constructor(private readonly importPlaylistItemsService: ImportPlaylistItemsService) {}

  @Get()
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    type: [ImportJobPlaylistItemDto],
    description: 'Get all items for the playlist as a raw array',
  })
  async listAll(
    @Param('id', ParseIntPipe) id: number,
    @Param('playlistId', ParseIntPipe) playlistId: number,
    @CurrentUser() user: User,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ImportJobPlaylistItemDto[]> {
    return this.importPlaylistItemsService.listAll(user, id, playlistId, locale);
  }

  @Get('paginated')
  @UseGuards(AuthGuard)
  @ApiOkResponse({ type: ListPaginatedImportPlaylistItemsDto })
  async listPaginated(
    @Param('id', ParseIntPipe) id: number,
    @Param('playlistId', ParseIntPipe) playlistId: number,
    @Query() query: PaginationQueryDto,
    @CurrentUser() user: User,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ListPaginatedImportPlaylistItemsDto> {
    return this.importPlaylistItemsService.listPaginated(user, id, playlistId, query, locale);
  }

  @Get('infinite')
  @UseGuards(AuthGuard)
  @ApiOkResponse({ type: ListInfiniteImportPlaylistItemsDto })
  async listInfinite(
    @Param('id', ParseIntPipe) id: number,
    @Param('playlistId', ParseIntPipe) playlistId: number,
    @Query() query: CursorPaginationQueryDto,
    @CurrentUser() user: User,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ListInfiniteImportPlaylistItemsDto> {
    return this.importPlaylistItemsService.listInfinite(user, id, playlistId, query, locale);
  }

  @Post(':itemId')
  @UseGuards(AuthGuard)
  @ApiOkResponse({ type: ImportJobPlaylistItemDto })
  async patch(
    @Param('id', ParseIntPipe) id: number,
    @Param('playlistId', ParseIntPipe) playlistId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: PatchImportJobPlaylistItemDto,
    @CurrentUser() user: User,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ImportJobPlaylistItemDto> {
    return this.importPlaylistItemsService.patch(user, id, playlistId, itemId, dto, locale);
  }
}
