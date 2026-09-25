import { Module } from '@nestjs/common';
import { ImportLogMovieReviewsController } from './import-log-movie-reviews.controller';
import { ImportLogMovieReviewsTool } from './import-log-movie-reviews.tool';
import { ImportLogMovieReviewsService } from './import-log-movie-reviews.service';

@Module({
  controllers: [ImportLogMovieReviewsController, ImportLogMovieReviewsTool],
  providers: [ImportLogMovieReviewsService],
})
export class ImportLogMovieReviewsModule {}
