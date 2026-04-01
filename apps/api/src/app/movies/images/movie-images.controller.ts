import { Controller, Param, UseGuards, ParseIntPipe, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { OptionalAuthGuard } from '../../auth/guards';
import { CurrentLocale } from '../../../common/decorators/current-locale.decorator';
import { SupportedLocale } from '@libs/i18n';
import { 
  ListInfiniteMovieImagesDto, 
  ListInfiniteMovieImagesQueryDto, 
  ListPaginatedMovieImagesDto, 
  ListPaginatedMovieImagesQueryDto 
} from './movie-images.dto';
import { MovieImagesService } from './movie-images.service';

@ApiTags('Movies')
@Controller({
  path: 'movie/:movie_id/images',
  version: '1',
})
export class MovieImagesController {
  constructor(private readonly imageService: MovieImagesService) {}

  @Get('paginated')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({ type: ListPaginatedMovieImagesDto })
  async listPaginated(
    @Param('movie_id', ParseIntPipe) movieId: number,
    @Query() query: ListPaginatedMovieImagesQueryDto,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ListPaginatedMovieImagesDto> {
    return this.imageService.listPaginated({
      movieId,
      query,
      locale,
    });
  }

  @Get('infinite')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({ type: ListInfiniteMovieImagesDto })
  async listInfinite(
    @Param('movie_id', ParseIntPipe) movieId: number,
    @Query() query: ListInfiniteMovieImagesQueryDto,
    @CurrentLocale() locale: SupportedLocale,
  ): Promise<ListInfiniteMovieImagesDto> {
    return this.imageService.listInfinite({
      movieId,
      query,
      locale,
    });
  }
}