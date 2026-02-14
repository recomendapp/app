import { Module } from '@nestjs/common';
import { TvSeasonsController } from './tv-seasons.controller';
import { TvSeasonsService } from './tv-seasons.service';

@Module({
  controllers: [TvSeasonsController],
  providers: [TvSeasonsService],
  exports: [TvSeasonsService],
})
export class TvSeasonsModule {}
