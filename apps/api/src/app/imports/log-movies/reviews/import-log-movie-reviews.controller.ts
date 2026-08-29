import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../../auth/guards';
import { CurrentUser } from '../../../auth/decorators';
import { User } from '../../../auth/auth.service';
import { ImportLogMovieReviewsService } from './import-log-movie-reviews.service';
import { ImportJobReviewDto, PatchImportJobReviewDto } from '../../dto/imports.dto';

@ApiTags('Imports')
@Controller({ path: 'import/:id/log-movies/:itemId/review', version: '1' })
export class ImportLogMovieReviewsController {
  constructor(private readonly importLogMovieReviewsService: ImportLogMovieReviewsService) {}

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
    return this.importLogMovieReviewsService.get(user, id, itemId);
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
    return this.importLogMovieReviewsService.patch(user, id, itemId, dto);
  }
}
