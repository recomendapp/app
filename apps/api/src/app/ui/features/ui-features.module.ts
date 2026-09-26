import { Module } from '@nestjs/common';
import { UiFeaturesController } from './ui-features.controller';
import { UiFeaturesService } from './ui-features.service';

@Module({
  controllers: [UiFeaturesController],
  providers: [UiFeaturesService],
})
export class UiFeaturesModule {}
