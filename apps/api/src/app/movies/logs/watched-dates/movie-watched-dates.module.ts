import { Module } from '@nestjs/common';
import { MovieWatchedDatesService } from './movie-watched-dates.service';
import { MovieWatchedDatesController } from './movie-watched-dates.controller';

@Module({
  controllers: [MovieWatchedDatesController],
  providers: [MovieWatchedDatesService],
  exports: [MovieWatchedDatesService],
})
export class MovieWatchedDatesModule {}