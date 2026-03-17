import { Controller, Post, Param, Body, UseGuards, Delete, ParseIntPipe, Get, Query } from '@nestjs/common';
import { TvSeriesReviewsService } from './tv-series-reviews.service';
import { ApiOkResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard, OptionalAuthGuard } from '../../auth/guards';
import { CurrentOptionalUser, CurrentUser } from '../../auth/decorators';
import { User } from '../../auth/auth.service';
import { ListInfiniteReviewsTvSeriesDto, ListInfiniteReviewsTvSeriesQueryDto, ListPaginatedReviewsTvSeriesDto, ListPaginatedReviewsTvSeriesQueryDto, ReviewTvSeriesDto, ReviewTvSeriesInputDto } from '../../reviews/tv-series/dto/review-tv-series.dto';

@ApiTags('TV Series')
@Controller({
  path: 'tv-series/:tv_series_id',
  version: '1',
})
export class TvSeriesReviewsController {
  constructor(private readonly reviewService: TvSeriesReviewsService) {}

  @Post('review')
  @UseGuards(AuthGuard)
  @ApiResponse({
    status: 200,
    description: 'TV series review created or updated successfully',
    type: ReviewTvSeriesDto,
  })
  async upsert(
    @Param('tv_series_id', ParseIntPipe) tvSeriesId: number,
    @Body() dto: ReviewTvSeriesInputDto,
	  @CurrentUser() user: User,
  ): Promise<ReviewTvSeriesDto> {
    return this.reviewService.upsert({
      user,
      tvSeriesId,
      dto,
    });
  }

  @Delete('review')
  @UseGuards(AuthGuard)
  @ApiResponse({
    status: 200,
    description: 'TV series review deleted successfully',
    type: ReviewTvSeriesDto,
  })
  async delete(
    @Param('tv_series_id', ParseIntPipe) tvSeriesId: number,
    @CurrentUser() user: User,
  ): Promise<ReviewTvSeriesDto> {
    return this.reviewService.delete({
      user,
      tvSeriesId,
    });
  }

  /* ---------------------------------- List ---------------------------------- */
  @Get('reviews/paginated')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get the list of tv series reviews for the user',
    type: ListPaginatedReviewsTvSeriesDto,
  })
  async listPaginated(
    @Param('tv_series_id', ParseIntPipe) tvSeriesId: number,
    @Query() query: ListPaginatedReviewsTvSeriesQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
  ): Promise<ListPaginatedReviewsTvSeriesDto> {
    return this.reviewService.listPaginated({
      tvSeriesId,
      query,
      currentUser,
    })
  }

  @Get('reviews/infinite')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Get the list of tv series reviews for the user with cursor pagination',
    type: ListInfiniteReviewsTvSeriesDto,
  })
  async listInfinite(
    @Param('tv_series_id', ParseIntPipe) tvSeriesId: number,
    @Query() query: ListInfiniteReviewsTvSeriesQueryDto,
    @CurrentOptionalUser() currentUser: User | null,
  ): Promise<ListInfiniteReviewsTvSeriesDto> {
    return this.reviewService.listInfinite({
      tvSeriesId,
      query,
      currentUser,
    });
  }
}