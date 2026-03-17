import { Module } from '@nestjs/common';
import { TvSeasonLogsService } from './tv-season-logs.service';
import { TvSeasonLogsController } from './tv-season-logs.controller';
import { TvLogsSyncModule } from '../../logs/sync/tv-logs-sync.module';

@Module({
  imports: [
	  TvLogsSyncModule,
  ], 
  controllers: [TvSeasonLogsController],
  providers: [TvSeasonLogsService],
  exports: [TvSeasonLogsService],
})
export class TvSeasonLogsModule {}