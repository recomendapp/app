import { Module } from '@nestjs/common';
import { UiBackgroundsModule } from './backgrounds/ui-backgrounds.module';
import { UiFeaturesModule } from './features/ui-features.module';

@Module({
  imports: [UiBackgroundsModule, UiFeaturesModule],
})
export class UiModule {}
