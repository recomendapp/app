import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/guards';
import { CurrentUser } from '../../auth/decorators';
import { User } from '../../auth/auth.service';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { CursorPaginationQueryDto } from '../../../common/dto/cursor-pagination.dto';
import { ImportPlaylistsService } from './import-playlists.service';
import {
  ImportJobPlaylistDto,
  ListInfiniteImportPlaylistsDto,
  ListPaginatedImportPlaylistsDto,
  PatchImportJobPlaylistDto,
} from './import-playlists.dto';

@ApiTags('Imports')
@Controller({ path: 'imports/:id/playlists', version: '1' })
export class ImportPlaylistsController {
  constructor(private readonly importPlaylistsService: ImportPlaylistsService) {}

  @Get()
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    type: [ImportJobPlaylistDto],
    description: 'Get all playlists for the job as a raw array',
  })
  async listAll(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<ImportJobPlaylistDto[]> {
    return this.importPlaylistsService.listAll(user, id);
  }

  @Get('paginated')
  @UseGuards(AuthGuard)
  @ApiOkResponse({ type: ListPaginatedImportPlaylistsDto })
  async listPaginated(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: PaginationQueryDto,
    @CurrentUser() user: User,
  ): Promise<ListPaginatedImportPlaylistsDto> {
    return this.importPlaylistsService.listPaginated(user, id, query);
  }

  @Get('infinite')
  @UseGuards(AuthGuard)
  @ApiOkResponse({ type: ListInfiniteImportPlaylistsDto })
  async listInfinite(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: CursorPaginationQueryDto,
    @CurrentUser() user: User,
  ): Promise<ListInfiniteImportPlaylistsDto> {
    return this.importPlaylistsService.listInfinite(user, id, query);
  }

  @Post(':itemId')
  @UseGuards(AuthGuard)
  @ApiOkResponse({ type: ImportJobPlaylistDto })
  async patch(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: PatchImportJobPlaylistDto,
    @CurrentUser() user: User,
  ): Promise<ImportJobPlaylistDto> {
    return this.importPlaylistsService.patch(user, id, itemId, dto);
  }
}
