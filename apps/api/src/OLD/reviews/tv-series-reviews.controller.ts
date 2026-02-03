import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateReviewDto, ReviewTvSeriesDto } from './dto';
import { ReviewsService } from './reviews.service';
import { AuthGuard } from '../../app/auth/guards';
import { AuthenticatedRequest } from '../../app/auth/types/fastify';

@ApiTags('TV Series')
@Controller({
  path: 'tv',
  version: '1',
})
@UseGuards(AuthGuard)
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
    @Request() req: AuthenticatedRequest,
    @Param('tvSeriesId', ParseIntPipe) tvSeriesId: number,
    @Body() createReviewDto: CreateReviewDto,
  ): Promise<ReviewTvSeriesDto> {
    const userId = req.user.id;
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
