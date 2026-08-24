import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/guards';
import { CurrentUser } from '../../auth/decorators';
import { User } from '../../auth/auth.service';
import { CurrentLocale } from '../../../common/decorators/current-locale.decorator';
import { SupportedLocale } from '@libs/i18n';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { CursorPaginationQueryDto } from '../../../common/dto/cursor-pagination.dto';
import { ImportLogMoviesService } from './import-log-movies.service';
import {
  ImportJobLogMovieDto,
  ListInfiniteImportLogMoviesDto,
  ListPaginatedImportLogMoviesDto,
  PatchImportJobLogMovieDto,
} from './import-log-movies.dto';

@ApiTags('Imports')
@Controller({ path: 'imports/:id/log-movies', version: '1' })
export class ImportLogMoviesController {
  constructor(private readonly importLogMoviesService: ImportLogMoviesService) {}

  @Get()
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    type: [ImportJobLogMovieDto],
    description: 'Get all log-movies for the job as a raw array',
  })
  async listAll(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ImportJobLogMovieDto[]> {
    return this.importLogMoviesService.listAll(user, id, locale);
  }

  @Get('paginated')
  @UseGuards(AuthGuard)
  @ApiOkResponse({ type: ListPaginatedImportLogMoviesDto })
  async listPaginated(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: PaginationQueryDto,
    @CurrentUser() user: User,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ListPaginatedImportLogMoviesDto> {
    return this.importLogMoviesService.listPaginated(user, id, query, locale);
  }

  @Get('infinite')
  @UseGuards(AuthGuard)
  @ApiOkResponse({ type: ListInfiniteImportLogMoviesDto })
  async listInfinite(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: CursorPaginationQueryDto,
    @CurrentUser() user: User,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ListInfiniteImportLogMoviesDto> {
    return this.importLogMoviesService.listInfinite(user, id, query, locale);
  }

  @Post(':itemId')
  @UseGuards(AuthGuard)
  @ApiOkResponse({ type: ImportJobLogMovieDto })
  async patch(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: PatchImportJobLogMovieDto,
    @CurrentUser() user: User,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ImportJobLogMovieDto> {
    return this.importLogMoviesService.patch(user, id, itemId, dto, locale);
  }
}
