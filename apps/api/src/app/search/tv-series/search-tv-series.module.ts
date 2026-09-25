import { Module } from '@nestjs/common';
import { SearchTvSeriesController } from './search-tv-series.controller';
import { SearchTvSeriesService } from './search-tv-series.service';
import { SearchTvSeriesTool } from './search-tv-series.tool';

@Module({
  controllers: [SearchTvSeriesController, SearchTvSeriesTool],
  providers: [SearchTvSeriesService],
  exports: [SearchTvSeriesService],
})
export class SearchTvSeriesModule {}
