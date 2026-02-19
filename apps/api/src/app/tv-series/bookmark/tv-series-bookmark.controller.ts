import { Controller, Post, Param, Body, UseGuards, Get, Delete, ParseIntPipe } from '@nestjs/common';
import { TvSeriesBookmarkService } from './tv-series-bookmark.service';
import { ApiExtraModels, ApiOkResponse, ApiResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/guards';
import { CurrentUser } from '../../auth/decorators';
import { User } from '../../auth/auth.service';
import { BookmarkDto, BookmarkRequestDto } from '../../bookmark/dto/bookmark.dto';

@ApiTags('Tv Series')
@Controller({
  path: 'tv-series/:tv_series_id/bookmark',
  version: '1',
})
export class TvSeriesBookmarkController {
  constructor(private readonly bookmarkService: TvSeriesBookmarkService) {}

  @Get()
  @UseGuards(AuthGuard)
  @ApiExtraModels(BookmarkDto)
  @ApiOkResponse({
    description: 'Get the bookmark for the authenticated user',
    schema: {
      nullable: true,
      allOf: [
        { $ref: getSchemaPath(BookmarkDto) }
      ]
    }
  })
  async get(
    @Param('tv_series_id', ParseIntPipe) tvSeriesId: number,
    @CurrentUser() user: User,
  ): Promise<BookmarkDto | null> {
    return this.bookmarkService.get({
      user,
      tvSeriesId,
    });
  }

  @Post()
  @UseGuards(AuthGuard)
  @ApiResponse({
    status: 200,
    description: 'TV Series bookmark created or updated successfully',
    type: BookmarkDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  async set(
    @Param('tv_series_id', ParseIntPipe) tvSeriesId: number,
    @Body() dto: BookmarkRequestDto,
    @CurrentUser() user: User,
  ): Promise<BookmarkDto> {
    return this.bookmarkService.set({
      user,
      tvSeriesId,
      dto,
    });
  }

  @Delete()
  @UseGuards(AuthGuard)
  @ApiResponse({
    status: 200,
    description: 'TV Series bookmark deleted successfully',
    type: BookmarkDto,
  })
  async delete(
    @Param('tv_series_id', ParseIntPipe) tvSeriesId: number,
    @CurrentUser() user: User,
  ): Promise<BookmarkDto> {
    return this.bookmarkService.delete({
      user,
      tvSeriesId,
    });
  }
}