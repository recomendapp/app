import { Module } from '@nestjs/common';
import { TvSeriesLogsService } from './tv-series-logs.service';
import { TvSeriesLogsController } from './tv-series-logs.controller';
import { SharedWorkerModule } from '@shared/worker';
import { TvLogsSyncModule } from './sync/tv-logs-sync.module';

@Module({
  imports: [
    SharedWorkerModule,
    TvLogsSyncModule,
  ],
  controllers: [TvSeriesLogsController],
  providers: [TvSeriesLogsService],
  exports: [TvSeriesLogsService],
})
export class TvSeriesLogsModule {}