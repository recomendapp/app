import { Module } from '@nestjs/common';
import { UserPushTokensService } from './user-push-tokens.service';
import { UserPushTokensController } from './user-push-tokens.controller';

@Module({
  controllers: [UserPushTokensController],
  providers: [UserPushTokensService],
  exports: [UserPushTokensService],
})
export class UserPushTokensModule {}