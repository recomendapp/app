import { Module } from '@nestjs/common';
import { TvSeasonsService } from './tv-seasons.service';
import { TvSeasonLogsModule } from './logs/tv-season-logs.module';
import { TvSeasonsController } from './tv-seasons.controller';
import { TvSeasonsTool } from './tv-seasons.tool';
import { TvEpisodesModule } from './episodes/tv-episodes.module';

@Module({
  imports: [TvSeasonLogsModule, TvEpisodesModule],
  controllers: [TvSeasonsController, TvSeasonsTool],
  providers: [TvSeasonsService],
  exports: [TvSeasonsService],
})
export class TvSeasonsModule {}
