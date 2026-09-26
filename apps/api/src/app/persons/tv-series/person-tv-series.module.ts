import { Module } from '@nestjs/common';
import { PersonTvSeriesService } from './person-tv-series.service';
import { PersonTvSeriesController } from './person-tv-series.controller';
import { PersonTvSeriesTool } from './person-tv-series.tool';

@Module({
  controllers: [PersonTvSeriesController, PersonTvSeriesTool],
  providers: [PersonTvSeriesService],
  exports: [PersonTvSeriesService],
})
export class PersonTvSeriesModule {}
