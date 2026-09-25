import { Module } from '@nestjs/common';
import { MePinnedService } from './me-pinned.service';
import { MePinnedController } from './me-pinned.controller';
import { MePinnedTool } from './me-pinned.tool';

@Module({
  controllers: [MePinnedController, MePinnedTool],
  providers: [MePinnedService],
  exports: [MePinnedService],
})
export class MePinnedModule {}
