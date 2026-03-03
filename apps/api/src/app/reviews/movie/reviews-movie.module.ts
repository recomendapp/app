import { Module } from '@nestjs/common';
import { ReviewsMovieService } from './reviews-movie.service';
import { ReviewsMovieController } from './reviews-movie.controller';
import { SharedWorkerModule } from '@shared/worker';

@Module({
  imports: [
    SharedWorkerModule,
  ],
  controllers: [ReviewsMovieController],
  providers: [ReviewsMovieService],
  exports: [ReviewsMovieService],
})
export class ReviewsMovieModule {}