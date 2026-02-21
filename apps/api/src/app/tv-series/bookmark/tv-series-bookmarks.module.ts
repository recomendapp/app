import { Module } from '@nestjs/common';
import { TvSeriesBookmarksService } from './tv-series-bookmarks.service';
import { TvSeriesBookmarksController } from './tv-series-bookmarks.controller';

@Module({
  controllers: [TvSeriesBookmarksController],
  providers: [TvSeriesBookmarksService],
  exports: [TvSeriesBookmarksService],
})
export class TvSeriesBookmarksModule {}