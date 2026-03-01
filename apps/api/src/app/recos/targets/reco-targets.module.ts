import { Module } from '@nestjs/common';
import { RecoTargetsService } from './reco-targets.service';
import { RecoTargetsController } from './reco-targets.controller';

@Module({
  providers: [RecoTargetsService],
  controllers: [RecoTargetsController],
  exports: [RecoTargetsService],
})
export class RecoTargetsModule {}