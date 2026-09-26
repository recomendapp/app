import { Module } from '@nestjs/common';
import { TvEpisodeLogsService } from './tv-episode-logs.service';
import { TvEpisodeLogsController } from './tv-episode-logs.controller';
import { TvEpisodeLogsTool } from './tv-episode-logs.tool';
import { TvLogsSyncModule } from '../../../logs/sync/tv-logs-sync.module';

@Module({
  imports: [TvLogsSyncModule],
  controllers: [TvEpisodeLogsController, TvEpisodeLogsTool],
  providers: [TvEpisodeLogsService],
  exports: [TvEpisodeLogsService],
})
export class TvEpisodeLogsModule {}
