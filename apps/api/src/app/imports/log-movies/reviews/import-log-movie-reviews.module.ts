import { Module } from '@nestjs/common';
import { ImportLogMovieReviewsController } from './import-log-movie-reviews.controller';
import { ImportLogMovieReviewsService } from './import-log-movie-reviews.service';

@Module({
  controllers: [ImportLogMovieReviewsController],
  providers: [ImportLogMovieReviewsService],
})
export class ImportLogMovieReviewsModule {}
