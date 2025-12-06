import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { CreateReviewDto, ReviewTvSeriesDto } from './dto';
import { ReviewsService } from './reviews.service';

@ApiTags('TV Series')
@Controller({
  path: 'tv',
  version: '1',
})
@UseGuards(AuthGuard('jwt'))
export class TvSeriesReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Put(':tvSeriesId/review')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create or update a TV series review' })
  @ApiResponse({
    status: 200,
    description: 'Review created or updated successfully',
    type: ReviewTvSeriesDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async upsertTvSeriesReview(
    @Request() req: FastifyRequest,
    @Param('tvSeriesId', ParseIntPipe) tvSeriesId: number,
    @Body() createReviewDto: CreateReviewDto,
  ): Promise<ReviewTvSeriesDto> {
    const userId = req.user?.sub;
    if (!userId) {
      throw new Error('User ID not found in request.');
    }
    return this.reviewsService.upsertTvSeriesReview(
      userId,
      tvSeriesId,
      createReviewDto,
    );
  }
}
