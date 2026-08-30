import { Module } from '@nestjs/common';
import { MePinnedService } from './me-pinned.service';
import { MePinnedController } from './me-pinned.controller';

@Module({
  controllers: [MePinnedController],
  providers: [MePinnedService],
  exports: [MePinnedService],
})
export class MePinnedModule {}
