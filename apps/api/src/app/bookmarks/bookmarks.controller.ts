import { Controller, Post, Param, Body, UseGuards, Get, Delete, ParseIntPipe, ParseEnumPipe, BadRequestException } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards';
import { CurrentUser } from '../auth/decorators';
import { User } from '../auth/auth.service';
import { BookmarkDto, BookmarkInputDto, BookmarkType } from '../bookmarks/dto/bookmarks.dto';
import { BookmarksService } from '../bookmarks/bookmarks.service';

@ApiTags('Bookmarks')
@Controller({
  path: 'bookmark',
  version: '1',
})
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  /* ---------------------------------- By Id --------------------------------- */
  @Get(':id')
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
  async getById(
    @Param('id', ParseIntPipe) bookmarkId: number,
    @CurrentUser() user: User,
  ): Promise<BookmarkDto | null> {
    return this.bookmarksService.get({
      user,
      id: bookmarkId,
    });
  }

  @Post(':id')
  @UseGuards(AuthGuard)
  @ApiResponse({
    status: 200,
    description: 'Bookmark updated successfully',
    type: BookmarkDto,
  })
  async updateById(
    @Param('id', ParseIntPipe) bookmarkId: number,
    @Body() dto: BookmarkInputDto,
    @CurrentUser() user: User,
  ): Promise<BookmarkDto> {
    return this.bookmarksService.set({
      user,
      id: bookmarkId,
      dto,
    });
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiResponse({
    status: 200,
    description: 'Bookmark deleted successfully',
    type: BookmarkDto,
  })
  async deleteById(
    @Param('id', ParseIntPipe) bookmarkId: number,
    @CurrentUser() user: User,
  ): Promise<BookmarkDto> {
    return this.bookmarksService.delete({
      user,
      id: bookmarkId,
    });
  }

  /* -------------------------------- By Media -------------------------------- */
  @Get(':type/:media_id')
  @UseGuards(AuthGuard)
  @ApiExtraModels(BookmarkDto)
  @ApiOkResponse({
    description: 'Get the bookmark for the authenticated user by media type',
    schema: {
      nullable: true,
      allOf: [
        { $ref: getSchemaPath(BookmarkDto) }
      ]
    }
  })
  async getByMedia(
    @Param('type', new ParseEnumPipe(BookmarkType)) type: BookmarkType,
    @Param('media_id', ParseIntPipe) mediaId: number,
    @CurrentUser() user: User,
  ): Promise<BookmarkDto | null> {
    if (type === 'movie') {
      return this.bookmarksService.get({ user, movieId: mediaId });
    } else if (type === 'tv_series') {
      return this.bookmarksService.get({ user, tvSeriesId: mediaId });
    } else {
      throw new BadRequestException(`Invalid bookmark type. Must be one of: ${Object.values(BookmarkType).join(', ')}`);
    }
  }

  @Post(':type/:media_id')
  @UseGuards(AuthGuard)
  @ApiResponse({
    status: 200,
    description: 'Bookmark created or updated successfully by media type',
    type: BookmarkDto,
  })
  async setByMedia(
    @Param('type', new ParseEnumPipe(BookmarkType)) type: BookmarkType,
    @Param('media_id', ParseIntPipe) mediaId: number,
    @Body() dto: BookmarkInputDto,
    @CurrentUser() user: User,
  ): Promise<BookmarkDto> {
    if (type === 'movie') {
      return this.bookmarksService.set({ user, dto, movieId: mediaId });
    } else if (type === 'tv_series') {
      return this.bookmarksService.set({ user, dto, tvSeriesId: mediaId });
    } else {
      throw new BadRequestException(`Invalid bookmark type. Must be one of: ${Object.values(BookmarkType).join(', ')}`);
    }
  }

  @Delete(':type/:media_id')
  @UseGuards(AuthGuard)
  @ApiResponse({
    status: 200,
    description: 'Bookmark deleted successfully by media type',
    type: BookmarkDto,
  })
  async deleteByMedia(
    @Param('type', new ParseEnumPipe(BookmarkType)) type: BookmarkType,
    @Param('media_id', ParseIntPipe) mediaId: number,
    @CurrentUser() user: User,
  ): Promise<BookmarkDto> {
    if (type === 'movie') {
      return this.bookmarksService.delete({ user, movieId: mediaId });
    } else if (type === 'tv_series') {
      return this.bookmarksService.delete({ user, tvSeriesId: mediaId });
    } else {
      throw new BadRequestException(`Invalid bookmark type. Must be one of: ${Object.values(BookmarkType).join(', ')}`);
    }
  }

}