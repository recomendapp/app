import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/guards';
import { CurrentUser } from '../../auth/decorators';
import { User } from '../../auth/auth.service';
import { CurrentLocale } from '../../../common/decorators/current-locale.decorator';
import { SupportedLocale } from '@libs/i18n';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { CursorPaginationQueryDto } from '../../../common/dto/cursor-pagination.dto';
import { ImportBookmarksService } from './import-bookmarks.service';
import {
  ImportJobBookmarkDto,
  ListInfiniteImportBookmarksDto,
  ListPaginatedImportBookmarksDto,
  PatchImportJobBookmarkDto,
} from './import-bookmarks.dto';

@ApiTags('Imports')
@Controller({ path: 'import/:id/bookmarks', version: '1' })
export class ImportBookmarksController {
  constructor(private readonly importBookmarksService: ImportBookmarksService) {}

  @Get()
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    type: [ImportJobBookmarkDto],
    description: 'Get all bookmarks for the job as a raw array',
  })
  async listAll(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ImportJobBookmarkDto[]> {
    return this.importBookmarksService.listAll(user, id, locale);
  }

  @Get('paginated')
  @UseGuards(AuthGuard)
  @ApiOkResponse({ type: ListPaginatedImportBookmarksDto })
  async listPaginated(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: PaginationQueryDto,
    @CurrentUser() user: User,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ListPaginatedImportBookmarksDto> {
    return this.importBookmarksService.listPaginated(user, id, query, locale);
  }

  @Get('infinite')
  @UseGuards(AuthGuard)
  @ApiOkResponse({ type: ListInfiniteImportBookmarksDto })
  async listInfinite(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: CursorPaginationQueryDto,
    @CurrentUser() user: User,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ListInfiniteImportBookmarksDto> {
    return this.importBookmarksService.listInfinite(user, id, query, locale);
  }

  @Post(':itemId')
  @UseGuards(AuthGuard)
  @ApiOkResponse({ type: ImportJobBookmarkDto })
  async patch(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: PatchImportJobBookmarkDto,
    @CurrentUser() user: User,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ImportJobBookmarkDto> {
    return this.importBookmarksService.patch(user, id, itemId, dto, locale);
  }
}
