import { Module } from '@nestjs/common';
import { TvSeriesLogsService } from './tv-series-logs.service';
import { TvSeriesLogsController } from './tv-series-logs.controller';
import { TvLogsSyncModule } from './sync/tv-logs-sync.module';

@Module({
  imports: [
    TvLogsSyncModule,
  ],
  controllers: [TvSeriesLogsController],
  providers: [TvSeriesLogsService],
  exports: [TvSeriesLogsService],
})
export class TvSeriesLogsModule {}