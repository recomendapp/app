import { Module } from '@nestjs/common';
import { UiBackgroundsModule } from './backgrounds/ui-backgrounds.module';

@Module({
  imports: [
    UiBackgroundsModule,
  ],
})
export class UiModule {}
