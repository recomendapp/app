import { Module } from '@nestjs/common';
import { UserTvSeriesService } from './user-tv-series.service';
import { UserTvSeriesController } from './user-tv-series.controller';
import { UserTvSeriesTool } from './user-tv-series.tool';

@Module({
  controllers: [UserTvSeriesController, UserTvSeriesTool],
  providers: [UserTvSeriesService],
  exports: [UserTvSeriesService],
})
export class UserTvSeriesModule {}
