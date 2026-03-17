import { Module } from '@nestjs/common';
import { TvSeasonsService } from './tv-seasons.service';
import { TvSeasonLogsModule } from './logs/tv-season-logs.module';
import { TvSeasonsController } from './tv-seasons.controller';
import { TvEpisodesModule } from './episodes/tv-episodes.module';

@Module({
  imports: [
    TvSeasonLogsModule,
    TvEpisodesModule,
  ],
  controllers: [TvSeasonsController],
  providers: [TvSeasonsService],
  exports: [TvSeasonsService],
})
export class TvSeasonsModule {}
