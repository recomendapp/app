import { Module } from '@nestjs/common';
import { MePushTokensService } from './me-push-tokens.service';
import { MePushTokensController } from './me-push-tokens.controller';

@Module({
  controllers: [MePushTokensController],
  providers: [MePushTokensService],
  exports: [MePushTokensService],
})
export class MePushTokensModule {}