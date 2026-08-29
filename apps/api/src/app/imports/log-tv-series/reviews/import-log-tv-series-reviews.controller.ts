import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../../auth/guards';
import { CurrentUser } from '../../../auth/decorators';
import { User } from '../../../auth/auth.service';
import { ImportLogTvSeriesReviewsService } from './import-log-tv-series-reviews.service';
import { ImportJobReviewDto, PatchImportJobReviewDto } from '../../dto/imports.dto';

@ApiTags('Imports')
@Controller({ path: 'import/:id/log-tv-series/:itemId/review', version: '1' })
export class ImportLogTvSeriesReviewsController {
  constructor(private readonly importLogTvSeriesReviewsService: ImportLogTvSeriesReviewsService) {}

  @Get()
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    type: ImportJobReviewDto,
    description: 'null if this item has no review to import',
  })
  async get(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @CurrentUser() user: User,
  ): Promise<ImportJobReviewDto | null> {
    return this.importLogTvSeriesReviewsService.get(user, id, itemId);
  }

  @Post()
  @UseGuards(AuthGuard)
  @ApiOkResponse({ type: ImportJobReviewDto })
  async patch(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: PatchImportJobReviewDto,
    @CurrentUser() user: User,
  ): Promise<ImportJobReviewDto> {
    return this.importLogTvSeriesReviewsService.patch(user, id, itemId, dto);
  }
}
