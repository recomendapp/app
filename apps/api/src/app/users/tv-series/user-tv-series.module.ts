import { Module } from '@nestjs/common';
import { UserTvSeriesService } from './user-tv-series.service';
import { UserTvSeriesController } from './user-tv-series.controller';

@Module({
  controllers: [UserTvSeriesController],
  providers: [UserTvSeriesService],
  exports: [UserTvSeriesService],
})
export class UserTvSeriesModule {}