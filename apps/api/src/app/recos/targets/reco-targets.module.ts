import { Module } from '@nestjs/common';
import { RecoTargetsService } from './reco-targets.service';
import { RecoTargetsController } from './reco-targets.controller';
import { RecoTargetsTool } from './reco-targets.tool';

@Module({
  providers: [RecoTargetsService],
  controllers: [RecoTargetsController, RecoTargetsTool],
  exports: [RecoTargetsService],
})
export class RecoTargetsModule {}
