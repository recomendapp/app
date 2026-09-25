import { Module } from '@nestjs/common';
import { TvEpisodeLogsModule } from './logs/tv-episode-logs.module';
import { TvEpisodesController } from './tv-episodes.controller';
import { TvEpisodesTool } from './tv-episodes.tool';
import { TvEpisodesService } from './tv-episodes.service';

@Module({
  imports: [TvEpisodeLogsModule],
  controllers: [TvEpisodesController, TvEpisodesTool],
  providers: [TvEpisodesService],
  exports: [TvEpisodesService],
})
export class TvEpisodesModule {}
