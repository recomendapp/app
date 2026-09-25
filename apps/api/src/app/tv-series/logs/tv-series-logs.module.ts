import { Module } from '@nestjs/common';
import { TvSeriesLogsService } from './tv-series-logs.service';
import { TvSeriesLogsController } from './tv-series-logs.controller';
import { TvSeriesLogsTool } from './tv-series-logs.tool';
import { TvLogsSyncModule } from './sync/tv-logs-sync.module';
import { RecosModule } from '../../recos/recos.module';

@Module({
  imports: [TvLogsSyncModule, RecosModule],
  controllers: [TvSeriesLogsController, TvSeriesLogsTool],
  providers: [TvSeriesLogsService],
  exports: [TvSeriesLogsService],
})
export class TvSeriesLogsModule {}
