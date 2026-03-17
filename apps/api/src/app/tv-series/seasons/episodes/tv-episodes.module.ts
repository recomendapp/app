import { Module } from '@nestjs/common';
import { TvEpisodeLogsModule } from './logs/tv-episode-logs.module';

@Module({
  imports: [
    TvEpisodeLogsModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class TvEpisodesModule {}
