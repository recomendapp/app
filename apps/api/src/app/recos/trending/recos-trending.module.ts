import { Module } from '@nestjs/common';
import { RecosTrendingService } from './recos-trending.service';
import { RecosTrendingController } from './recos-trending.controller';
import { RecosTrendingTool } from './recos-trending.tool';

@Module({
  providers: [RecosTrendingService],
  controllers: [RecosTrendingController, RecosTrendingTool],
  exports: [RecosTrendingService],
})
export class RecosTrendingModule {}
