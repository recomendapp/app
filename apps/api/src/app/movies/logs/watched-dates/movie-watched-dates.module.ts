import { Module } from '@nestjs/common';
import { MovieWatchedDatesService } from './movie-watched-dates.service';
import { MovieWatchedDatesController } from './movie-watched-dates.controller';
import { MovieWatchedDatesTool } from './movie-watched-dates.tool';

@Module({
  controllers: [MovieWatchedDatesController, MovieWatchedDatesTool],
  providers: [MovieWatchedDatesService],
  exports: [MovieWatchedDatesService],
})
export class MovieWatchedDatesModule {}
