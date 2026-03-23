import { Module } from '@nestjs/common';
import { SearchTvSeriesController } from './search-tv-series.controller';
import { SearchTvSeriesService } from './search-tv-series.service';

@Module({
  controllers: [SearchTvSeriesController],
  providers: [SearchTvSeriesService],
  exports: [SearchTvSeriesService],
})
export class SearchTvSeriesModule {}
