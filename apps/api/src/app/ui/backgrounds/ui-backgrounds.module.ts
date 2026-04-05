import { Module } from '@nestjs/common';
import { UiBackgroundsController } from './ui-backgrounds.controller';
import { UiBackgroundsService } from './ui-backgrounds.service';

@Module({
  controllers: [UiBackgroundsController],
  providers: [UiBackgroundsService],
  exports: [UiBackgroundsService],
})
export class UiBackgroundsModule {}
