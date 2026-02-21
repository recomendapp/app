import { Module } from '@nestjs/common';
import { PersonTvSeriesService } from './person-tv-series.service';
import { PersonTvSeriesController } from './person-tv-series.controller';

@Module({
  controllers: [PersonTvSeriesController],
  providers: [PersonTvSeriesService],
  exports: [PersonTvSeriesService],
})
export class PersonTvSeriesModule {}