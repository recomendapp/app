import { Module } from '@nestjs/common';
import { ImportLogMoviesController } from './import-log-movies.controller';
import { ImportLogMoviesTool } from './import-log-movies.tool';
import { ImportLogMoviesService } from './import-log-movies.service';
import { ImportLogMovieReviewsModule } from './reviews/import-log-movie-reviews.module';

@Module({
  imports: [ImportLogMovieReviewsModule],
  controllers: [ImportLogMoviesController, ImportLogMoviesTool],
  providers: [ImportLogMoviesService],
})
export class ImportLogMoviesModule {}
