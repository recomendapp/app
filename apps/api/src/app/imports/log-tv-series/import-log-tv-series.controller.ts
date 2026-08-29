import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/guards';
import { CurrentUser } from '../../auth/decorators';
import { User } from '../../auth/auth.service';
import { CurrentLocale } from '../../../common/decorators/current-locale.decorator';
import { SupportedLocale } from '@libs/i18n';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { CursorPaginationQueryDto } from '../../../common/dto/cursor-pagination.dto';
import { ImportLogTvSeriesService } from './import-log-tv-series.service';
import {
  ImportJobLogTvSeriesDto,
  ListInfiniteImportLogTvSeriesDto,
  ListPaginatedImportLogTvSeriesDto,
  PatchImportJobLogTvSeriesDto,
} from './import-log-tv-series.dto';

@ApiTags('Imports')
@Controller({ path: 'import/:id/log-tv-series', version: '1' })
export class ImportLogTvSeriesController {
  constructor(private readonly importLogTvSeriesService: ImportLogTvSeriesService) {}

  @Get()
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    type: [ImportJobLogTvSeriesDto],
    description: 'Get all log-tv-series for the job as a raw array',
  })
  async listAll(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ImportJobLogTvSeriesDto[]> {
    return this.importLogTvSeriesService.listAll(user, id, locale);
  }

  @Get('paginated')
  @UseGuards(AuthGuard)
  @ApiOkResponse({ type: ListPaginatedImportLogTvSeriesDto })
  async listPaginated(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: PaginationQueryDto,
    @CurrentUser() user: User,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ListPaginatedImportLogTvSeriesDto> {
    return this.importLogTvSeriesService.listPaginated(user, id, query, locale);
  }

  @Get('infinite')
  @UseGuards(AuthGuard)
  @ApiOkResponse({ type: ListInfiniteImportLogTvSeriesDto })
  async listInfinite(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: CursorPaginationQueryDto,
    @CurrentUser() user: User,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ListInfiniteImportLogTvSeriesDto> {
    return this.importLogTvSeriesService.listInfinite(user, id, query, locale);
  }

  @Post(':itemId')
  @UseGuards(AuthGuard)
  @ApiOkResponse({ type: ImportJobLogTvSeriesDto })
  async patch(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: PatchImportJobLogTvSeriesDto,
    @CurrentUser() user: User,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ImportJobLogTvSeriesDto> {
    return this.importLogTvSeriesService.patch(user, id, itemId, dto, locale);
  }
}
