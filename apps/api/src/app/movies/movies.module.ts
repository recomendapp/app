import { Module } from '@nestjs/common';
import { MovieLogsModule } from './log/movie-logs.module';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';
import { MovieReviewsModule } from './reviews/movie-reviews.module';
import { MovieBookmarksModule } from './bookmarks/movie-bookmarks.module';
import { MoviePlaylistsModule } from './playlists/movie-playlists.module';

@Module({
  imports: [
    MovieLogsModule,
    MoviePlaylistsModule,
    MovieReviewsModule,
    MovieBookmarksModule,
  ],
  controllers: [MoviesController],
  providers: [MoviesService],
  exports: [MoviesService],
})
export class MoviesModule {}
