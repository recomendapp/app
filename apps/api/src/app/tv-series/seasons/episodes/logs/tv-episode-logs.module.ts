import { Module } from '@nestjs/common';
import { TvEpisodeLogsService } from './tv-episode-logs.service';
import { TvEpisodeLogsController } from './tv-episode-logs.controller';
import { TvLogsSyncModule } from '../../../logs/sync/tv-logs-sync.module';

@Module({
  imports: [
    TvLogsSyncModule,
  ], 
  controllers: [TvEpisodeLogsController],
  providers: [TvEpisodeLogsService],
  exports: [TvEpisodeLogsService],
})
export class TvEpisodeLogsModule {}