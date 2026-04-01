import { Module } from '@nestjs/common';
import { MovieLogsModule } from './logs/movie-logs.module';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';
import { MovieReviewsModule } from './reviews/movie-reviews.module';
import { MoviePlaylistsModule } from './playlists/movie-playlists.module';
import { MovieImagesModule } from './images/movie-images.module';

@Module({
  imports: [
    MovieLogsModule,
    MoviePlaylistsModule,
    MovieReviewsModule,
    MovieImagesModule,
  ],
  controllers: [MoviesController],
  providers: [MoviesService],
  exports: [MoviesService],
})
export class MoviesModule {}
