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
import { CreateReviewDto, ReviewMovieDto } from './dto';
import { ReviewsService } from './reviews.service';

@ApiTags('Movies')
@Controller({
  path: 'movie',
  version: '1',
})
@UseGuards(AuthGuard('jwt'))
export class MovieReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Put(':movieId/review')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create or update a movie review' })
  @ApiResponse({
    status: 200,
    description: 'Review created or updated successfully',
    type: ReviewMovieDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async upsertMovieReview(
    @Request() req: FastifyRequest,
    @Param('movieId', ParseIntPipe) movieId: number,
    @Body() createReviewDto: CreateReviewDto,
  ): Promise<ReviewMovieDto> {
    const userId = req.user?.sub;
    if (!userId) {
      throw new Error('User ID not found in request.');
    }
    return this.reviewsService.upsertMovieReview(
      userId,
      movieId,
      createReviewDto,
    );
  }
}
