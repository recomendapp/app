import { Module } from '@nestjs/common';
import { RecosTrendingService } from './recos-trending.service';
import { RecosTrendingController } from './recos-trending.controller';

@Module({
  providers: [RecosTrendingService],
  controllers: [RecosTrendingController],
  exports: [RecosTrendingService],
})
export class RecosTrendingModule {}