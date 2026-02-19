import { Controller, Post, Param, Body, UseGuards, Get, Delete, ParseIntPipe, Query } from '@nestjs/common';
import { MoviesBookmarkService } from './movies-bookmark.service';
import { ApiExtraModels, ApiOkResponse, ApiResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/guards';
import { CurrentUser } from '../../auth/decorators';
import { User } from '../../auth/auth.service';
import { BookmarkDto, BookmarkRequestDto } from '../../bookmark/dto/bookmark.dto';

@ApiTags('Movies')
@Controller({
  path: 'movie/:movie_id/bookmark',
  version: '1',
})
export class MoviesBookmarkController {
  constructor(private readonly bookmarkService: MoviesBookmarkService) {}

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
    @Param('movie_id', ParseIntPipe) movieId: number,
    @CurrentUser() user: User,
  ): Promise<BookmarkDto | null> {
    return this.bookmarkService.get({
      user,
      movieId,
    });
  }

  @Post()
  @UseGuards(AuthGuard)
  @ApiResponse({
    status: 200,
    description: 'Movie bookmark created or updated successfully',
    type: BookmarkDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  async set(
    @Param('movie_id', ParseIntPipe) movieId: number,
    @Body() dto: BookmarkRequestDto,
    @CurrentUser() user: User,
  ): Promise<BookmarkDto> {
    return this.bookmarkService.set({
      user,
      movieId,
      dto,
    });
  }

  @Delete()
  @UseGuards(AuthGuard)
  @ApiResponse({
    status: 200,
    description: 'Movie bookmark deleted successfully',
    type: BookmarkDto,
  })
  async delete(
    @Param('movie_id', ParseIntPipe) movieId: number,
    @CurrentUser() user: User,
  ): Promise<BookmarkDto> {
    return this.bookmarkService.delete({
      user,
      movieId,
    });
  }
}