import { Module } from '@nestjs/common';
import { TvEpisodeLogsModule } from './logs/tv-episode-logs.module';
import { TvEpisodesController } from './tv-episodes.controller';
import { TvEpisodesService } from './tv-episodes.service';

@Module({
  imports: [
    TvEpisodeLogsModule,
  ],
  controllers: [TvEpisodesController],
  providers: [TvEpisodesService],
  exports: [TvEpisodesService],
})
export class TvEpisodesModule {}
