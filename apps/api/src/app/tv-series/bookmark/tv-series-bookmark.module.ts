import { Module } from '@nestjs/common';
import { TvSeriesBookmarkService } from './tv-series-bookmark.service';
import { TvSeriesBookmarkController } from './tv-series-bookmark.controller';

@Module({
  controllers: [TvSeriesBookmarkController],
  providers: [TvSeriesBookmarkService],
  exports: [TvSeriesBookmarkService],
})
export class TvSeriesBookmarkModule {}