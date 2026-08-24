import { Module } from '@nestjs/common';
import { ImportLogMoviesController } from './import-log-movies.controller';
import { ImportLogMoviesService } from './import-log-movies.service';
import { ImportLogMovieReviewsModule } from './reviews/import-log-movie-reviews.module';

@Module({
  imports: [ImportLogMovieReviewsModule],
  controllers: [ImportLogMoviesController],
  providers: [ImportLogMoviesService],
})
export class ImportLogMoviesModule {}
